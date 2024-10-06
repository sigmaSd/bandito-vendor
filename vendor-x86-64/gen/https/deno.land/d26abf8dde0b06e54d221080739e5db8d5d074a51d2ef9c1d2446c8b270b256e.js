// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/** A snapshotting library.
 *
 * The `assertSnapshot` function will create a snapshot of a value and compare it
 * to a reference snapshot, which is stored alongside the test file in the
 * `__snapshots__` directory.
 *
 * ```ts
 * // example_test.ts
 * import { assertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = {
 *     hello: "world!",
 *     example: 123,
 *   };
 *   await assertSnapshot(t, a);
 * });
 * ```
 *
 * ```js
 * // __snapshots__/example_test.ts.snap
 * export const snapshot = {};
 *
 * snapshot[`isSnapshotMatch 1`] = `
 * {
 *   example: 123,
 *   hello: "world!",
 * }
 * `;
 * ```
 *
 * Calling `assertSnapshot` in a test will throw an `AssertionError`, causing the
 * test to fail, if the snapshot created during the test does not match the one in
 * the snapshot file.
 *
 * ## Updating Snapshots:
 *
 * When adding new snapshot assertions to your test suite, or when intentionally
 * making changes which cause your snapshots to fail, you can update your snapshots
 * by running the snapshot tests in update mode. Tests can be run in update mode by
 * passing the `--update` or `-u` flag as an argument when running the test. When
 * this flag is passed, then any snapshots which do not match will be updated.
 *
 * ```sh
 * deno test --allow-all -- --update
 * ```
 *
 * Additionally, new snapshots will only be created when this flag is present.
 *
 * ## Permissions:
 *
 * When running snapshot tests, the `--allow-read` permission must be enabled, or
 * else any calls to `assertSnapshot` will fail due to insufficient permissions.
 * Additionally, when updating snapshots, the `--allow-write` permission must also
 * be enabled, as this is required in order to update snapshot files.
 *
 * The `assertSnapshot` function will only attempt to read from and write to
 * snapshot files. As such, the allow list for `--allow-read` and `--allow-write`
 * can be limited to only include existing snapshot files, if so desired.
 *
 * ## Options:
 *
 * The `assertSnapshot` function optionally accepts an options object.
 *
 * ```ts
 * // example_test.ts
 * import { assertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = {
 *     hello: "world!",
 *     example: 123,
 *   };
 *   await assertSnapshot(t, a, {
 *     // options
 *   });
 * });
 * ```
 *
 * You can also configure default options for `assertSnapshot`.
 *
 * ```ts
 * // example_test.ts
 * import { createAssertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";
 *
 * const assertSnapshot = createAssertSnapshot({
 *   // options
 * });
 * ```
 *
 * When configuring default options like this, the resulting `assertSnapshot`
 * function will function the same as the default function exported from the
 * snapshot module. If passed an optional options object, this will take precedence
 * over the default options, where the value provided for an option differs.
 *
 * It is possible to "extend" an `assertSnapshot` function which has been
 * configured with default options.
 *
 * ```ts
 * // example_test.ts
 * import { createAssertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";
 * import { stripAnsiCode } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *
 * const assertSnapshot = createAssertSnapshot({
 *   dir: ".snaps",
 * });
 *
 * const assertMonochromeSnapshot = createAssertSnapshot<string>(
 *   { serializer: stripAnsiCode },
 *   assertSnapshot,
 * );
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = "\x1b[32mThis green text has had it's colours stripped\x1b[39m";
 *   await assertMonochromeSnapshot(t, a);
 * });
 * ```
 *
 * ```js
 * // .snaps/example_test.ts.snap
 * export const snapshot = {};
 *
 * snapshot[`isSnapshotMatch 1`] = `This green text has had it's colours stripped`;
 * ```
 *
 * ## Version Control:
 *
 * Snapshot testing works best when changes to snapshot files are committed
 * alongside other code changes. This allows for changes to reference snapshots to
 * be reviewed along side the code changes that caused them, and ensures that when
 * others pull your changes, their tests will pass without needing to update
 * snapshots locally.
 *
 * @module
 */ import { fromFileUrl } from "../path/from_file_url.ts";
import { parse } from "../path/parse.ts";
import { resolve } from "../path/resolve.ts";
import { toFileUrl } from "../path/to_file_url.ts";
import { ensureFile, ensureFileSync } from "../fs/ensure_file.ts";
import { bold, green, red } from "../fmt/colors.ts";
import { assert } from "../assert/assert.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { assertEquals } from "../assert/assert_equals.ts";
const SNAPSHOT_DIR = "__snapshots__";
const SNAPSHOT_EXT = "snap";
function getErrorMessage(message, options) {
  return typeof options.msg === "string" ? options.msg : message;
}
export function serialize(actual) {
  return Deno.inspect(actual, {
    depth: Infinity,
    sorted: true,
    trailingComma: true,
    compact: false,
    iterableLimit: Infinity,
    strAbbreviateSize: Infinity,
    breakLength: Infinity,
    escapeSequences: false
  });
}
/**
 * Converts a string to a valid JavaScript string which can be wrapped in backticks.
 *
 * @example
 *
 * "special characters (\ ` $) will be escaped" -> "special characters (\\ \` \$) will be escaped"
 */ function escapeStringForJs(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
let _mode;
/**
 * Get the snapshot mode.
 */ function getMode(options) {
  if (options.mode) {
    return options.mode;
  } else if (_mode) {
    return _mode;
  } else {
    _mode = Deno.args.some((arg)=>arg === "--update" || arg === "-u") ? "update" : "assert";
    return _mode;
  }
}
/**
 * Return `true` when snapshot mode is `update`.
 */ function getIsUpdate(options) {
  return getMode(options) === "update";
}
class AssertSnapshotContext {
  static contexts = new Map();
  /**
   * Returns an instance of `AssertSnapshotContext`. This will be retrieved from
   * a cache if an instance was already created for a given snapshot file path.
   */ static fromOptions(testContext, options) {
    let path;
    const testFilePath = fromFileUrl(testContext.origin);
    const { dir, base } = parse(testFilePath);
    if (options.path) {
      path = resolve(dir, options.path);
    } else if (options.dir) {
      path = resolve(dir, options.dir, `${base}.${SNAPSHOT_EXT}`);
    } else {
      path = resolve(dir, SNAPSHOT_DIR, `${base}.${SNAPSHOT_EXT}`);
    }
    let context = this.contexts.get(path);
    if (context) {
      return context;
    }
    context = new this(toFileUrl(path));
    this.contexts.set(path, context);
    return context;
  }
  #teardownRegistered = false;
  #currentSnapshots;
  #updatedSnapshots = new Map();
  #snapshotCounts = new Map();
  #snapshotsUpdated = new Array();
  #snapshotFileUrl;
  snapshotUpdateQueue = new Array();
  constructor(snapshotFileUrl){
    this.#snapshotFileUrl = snapshotFileUrl;
  }
  /**
   * Asserts that `this.#currentSnapshots` has been initialized and then returns it.
   *
   * Should only be called when `this.#currentSnapshots` has already been initialized.
   */ #getCurrentSnapshotsInitialized() {
    assert(this.#currentSnapshots, "Snapshot was not initialized. This is a bug in `assertSnapshot`.");
    return this.#currentSnapshots;
  }
  /**
   * Write updates to the snapshot file and log statistics.
   */ #teardown = ()=>{
    const buf = [
      "export const snapshot = {};"
    ];
    const currentSnapshots = this.#getCurrentSnapshotsInitialized();
    const currentSnapshotNames = Array.from(currentSnapshots.keys());
    const removedSnapshotNames = currentSnapshotNames.filter((name)=>!this.snapshotUpdateQueue.includes(name));
    this.snapshotUpdateQueue.forEach((name)=>{
      const updatedSnapshot = this.#updatedSnapshots.get(name);
      const currentSnapshot = currentSnapshots.get(name);
      let formattedSnapshot;
      if (typeof updatedSnapshot === "string") {
        formattedSnapshot = updatedSnapshot;
      } else if (typeof currentSnapshot === "string") {
        formattedSnapshot = currentSnapshot;
      } else {
        // This occurs when `assertSnapshot` is called in "assert" mode but
        // the snapshot doesn't exist and `assertSnapshot` is also called in
        // "update" mode. In this case, we have nothing to write to the
        // snapshot file so we can just exit early
        return;
      }
      formattedSnapshot = escapeStringForJs(formattedSnapshot);
      formattedSnapshot = formattedSnapshot.includes("\n") ? `\n${formattedSnapshot}\n` : formattedSnapshot;
      const formattedName = escapeStringForJs(name);
      buf.push(`\nsnapshot[\`${formattedName}\`] = \`${formattedSnapshot}\`;`);
    });
    const snapshotFilePath = fromFileUrl(this.#snapshotFileUrl);
    ensureFileSync(snapshotFilePath);
    Deno.writeTextFileSync(snapshotFilePath, buf.join("\n") + "\n");
    const updated = this.getUpdatedCount();
    if (updated > 0) {
      console.log(green(bold(`\n > ${updated} ${updated === 1 ? "snapshot" : "snapshots"} updated.`)));
    }
    const removed = removedSnapshotNames.length;
    if (removed > 0) {
      console.log(red(bold(`\n > ${removed} ${removed === 1 ? "snapshot" : "snapshots"} removed.`)));
      for (const snapshotName of removedSnapshotNames){
        console.log(red(bold(`   • ${snapshotName}`)));
      }
    }
  };
  /**
   * Returns `this.#currentSnapshots` and if necessary, tries to initialize it by reading existing
   * snapshots from the snapshot file. If the snapshot mode is `update` and the snapshot file does
   * not exist then it will be created.
   */ async #readSnapshotFile(options) {
    if (this.#currentSnapshots) {
      return this.#currentSnapshots;
    }
    if (getIsUpdate(options)) {
      await ensureFile(fromFileUrl(this.#snapshotFileUrl));
    }
    try {
      const snapshotFileUrl = this.#snapshotFileUrl.toString();
      const { snapshot } = await import(snapshotFileUrl);
      this.#currentSnapshots = typeof snapshot === "undefined" ? new Map() : new Map(Object.entries(snapshot).map(([name, snapshot])=>{
        if (typeof snapshot !== "string") {
          throw new AssertionError(getErrorMessage(`Corrupt snapshot:\n\t(${name})\n\t${snapshotFileUrl}`, options));
        }
        return [
          name,
          snapshot.includes("\n") ? snapshot.slice(1, -1) : snapshot
        ];
      }));
      return this.#currentSnapshots;
    } catch (error) {
      if (error instanceof TypeError && error.message.startsWith("Module not found")) {
        throw new AssertionError(getErrorMessage("Missing snapshot file.", options));
      }
      throw error;
    }
  }
  /**
   * Register a teardown function which writes the snapshot file to disk and logs the number
   * of snapshots updated after all tests have run.
   *
   * This method can safely be called more than once and will only register the teardown
   * function once in a context.
   */ registerTeardown() {
    if (!this.#teardownRegistered) {
      globalThis.addEventListener("unload", this.#teardown);
      this.#teardownRegistered = true;
    }
  }
  /**
   * Gets the number of snapshots which have been created with the same name and increments
   * the count by 1.
   */ getCount(snapshotName) {
    let count = this.#snapshotCounts.get(snapshotName) || 0;
    this.#snapshotCounts.set(snapshotName, ++count);
    return count;
  }
  /**
   * Get an existing snapshot by name or returns `undefined` if the snapshot does not exist.
   */ async getSnapshot(snapshotName, options) {
    const snapshots = await this.#readSnapshotFile(options);
    return snapshots.get(snapshotName);
  }
  /**
   * Update a snapshot by name. Updates will be written to the snapshot file when all tests
   * have run. If the snapshot does not exist, it will be created.
   *
   * Should only be called when mode is `update`.
   */ updateSnapshot(snapshotName, snapshot) {
    if (!this.#snapshotsUpdated.includes(snapshotName)) {
      this.#snapshotsUpdated.push(snapshotName);
    }
    const currentSnapshots = this.#getCurrentSnapshotsInitialized();
    if (!currentSnapshots.has(snapshotName)) {
      currentSnapshots.set(snapshotName, undefined);
    }
    this.#updatedSnapshots.set(snapshotName, snapshot);
  }
  /**
   * Get the number of updated snapshots.
   */ getUpdatedCount() {
    return this.#snapshotsUpdated.length;
  }
  /**
   * Add a snapshot to the update queue.
   *
   * Tracks the order in which snapshots were created so that they can be written to
   * the snapshot file in the correct order.
   *
   * Should be called with each snapshot, regardless of the mode, as a future call to
   * `assertSnapshot` could cause updates to be written to the snapshot file if the
   * `update` mode is passed in the options.
   */ pushSnapshotToUpdateQueue(snapshotName) {
    this.snapshotUpdateQueue.push(snapshotName);
  }
  /**
   * Check if exist snapshot
   */ hasSnapshot(snapshotName) {
    return this.#currentSnapshots ? this.#currentSnapshots.has(snapshotName) : false;
  }
}
export async function assertSnapshot(context, actual, msgOrOpts) {
  const options = getOptions();
  const assertSnapshotContext = AssertSnapshotContext.fromOptions(context, options);
  const testName = getTestName(context, options);
  const count = assertSnapshotContext.getCount(testName);
  const name = `${testName} ${count}`;
  const snapshot = await assertSnapshotContext.getSnapshot(name, options);
  assertSnapshotContext.pushSnapshotToUpdateQueue(name);
  const _serialize = options.serializer || serialize;
  const _actual = _serialize(actual);
  if (getIsUpdate(options)) {
    assertSnapshotContext.registerTeardown();
    if (!equal(_actual, snapshot)) {
      assertSnapshotContext.updateSnapshot(name, _actual);
    }
  } else {
    if (!assertSnapshotContext.hasSnapshot(name) || typeof snapshot === "undefined") {
      throw new AssertionError(getErrorMessage(`Missing snapshot: ${name}`, options));
    }
    if (equal(_actual, snapshot)) {
      return;
    }
    let message = "";
    try {
      const usesMultilineDiff = _actual.includes("\n");
      if (usesMultilineDiff) {
        assertEquals(true, false, undefined, {
          formatter: (v)=>v ? _actual : snapshot
        });
      } else {
        assertEquals(_actual, snapshot);
      }
    } catch (e) {
      if (e instanceof AssertionError) {
        message = e.message.replace("Values are not equal.", "Snapshot does not match:");
      }
    }
    throw new AssertionError(getErrorMessage(message, options));
  }
  function getOptions() {
    if (typeof msgOrOpts === "object" && msgOrOpts !== null) {
      return msgOrOpts;
    }
    return {
      msg: msgOrOpts
    };
  }
  function getTestName(context, options) {
    if (options && options.name) {
      return options.name;
    } else if (context.parent) {
      return `${getTestName(context.parent)} > ${context.name}`;
    }
    return context.name;
  }
}
export function createAssertSnapshot(options, baseAssertSnapshot = assertSnapshot) {
  return async function _assertSnapshot(context, actual, messageOrOptions) {
    const mergedOptions = {
      ...options,
      ...typeof messageOrOptions === "string" ? {
        msg: messageOrOptions
      } : messageOrOptions
    };
    await baseAssertSnapshot(context, actual, mergedOptions);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL3Rlc3Rpbmcvc25hcHNob3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqIEEgc25hcHNob3R0aW5nIGxpYnJhcnkuXG4gKlxuICogVGhlIGBhc3NlcnRTbmFwc2hvdGAgZnVuY3Rpb24gd2lsbCBjcmVhdGUgYSBzbmFwc2hvdCBvZiBhIHZhbHVlIGFuZCBjb21wYXJlIGl0XG4gKiB0byBhIHJlZmVyZW5jZSBzbmFwc2hvdCwgd2hpY2ggaXMgc3RvcmVkIGFsb25nc2lkZSB0aGUgdGVzdCBmaWxlIGluIHRoZVxuICogYF9fc25hcHNob3RzX19gIGRpcmVjdG9yeS5cbiAqXG4gKiBgYGB0c1xuICogLy8gZXhhbXBsZV90ZXN0LnRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTbmFwc2hvdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3Rpbmcvc25hcHNob3QudHNcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJpc1NuYXBzaG90TWF0Y2hcIiwgYXN5bmMgZnVuY3Rpb24gKHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAqICAgY29uc3QgYSA9IHtcbiAqICAgICBoZWxsbzogXCJ3b3JsZCFcIixcbiAqICAgICBleGFtcGxlOiAxMjMsXG4gKiAgIH07XG4gKiAgIGF3YWl0IGFzc2VydFNuYXBzaG90KHQsIGEpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogLy8gX19zbmFwc2hvdHNfXy9leGFtcGxlX3Rlc3QudHMuc25hcFxuICogZXhwb3J0IGNvbnN0IHNuYXBzaG90ID0ge307XG4gKlxuICogc25hcHNob3RbYGlzU25hcHNob3RNYXRjaCAxYF0gPSBgXG4gKiB7XG4gKiAgIGV4YW1wbGU6IDEyMyxcbiAqICAgaGVsbG86IFwid29ybGQhXCIsXG4gKiB9XG4gKiBgO1xuICogYGBgXG4gKlxuICogQ2FsbGluZyBgYXNzZXJ0U25hcHNob3RgIGluIGEgdGVzdCB3aWxsIHRocm93IGFuIGBBc3NlcnRpb25FcnJvcmAsIGNhdXNpbmcgdGhlXG4gKiB0ZXN0IHRvIGZhaWwsIGlmIHRoZSBzbmFwc2hvdCBjcmVhdGVkIGR1cmluZyB0aGUgdGVzdCBkb2VzIG5vdCBtYXRjaCB0aGUgb25lIGluXG4gKiB0aGUgc25hcHNob3QgZmlsZS5cbiAqXG4gKiAjIyBVcGRhdGluZyBTbmFwc2hvdHM6XG4gKlxuICogV2hlbiBhZGRpbmcgbmV3IHNuYXBzaG90IGFzc2VydGlvbnMgdG8geW91ciB0ZXN0IHN1aXRlLCBvciB3aGVuIGludGVudGlvbmFsbHlcbiAqIG1ha2luZyBjaGFuZ2VzIHdoaWNoIGNhdXNlIHlvdXIgc25hcHNob3RzIHRvIGZhaWwsIHlvdSBjYW4gdXBkYXRlIHlvdXIgc25hcHNob3RzXG4gKiBieSBydW5uaW5nIHRoZSBzbmFwc2hvdCB0ZXN0cyBpbiB1cGRhdGUgbW9kZS4gVGVzdHMgY2FuIGJlIHJ1biBpbiB1cGRhdGUgbW9kZSBieVxuICogcGFzc2luZyB0aGUgYC0tdXBkYXRlYCBvciBgLXVgIGZsYWcgYXMgYW4gYXJndW1lbnQgd2hlbiBydW5uaW5nIHRoZSB0ZXN0LiBXaGVuXG4gKiB0aGlzIGZsYWcgaXMgcGFzc2VkLCB0aGVuIGFueSBzbmFwc2hvdHMgd2hpY2ggZG8gbm90IG1hdGNoIHdpbGwgYmUgdXBkYXRlZC5cbiAqXG4gKiBgYGBzaFxuICogZGVubyB0ZXN0IC0tYWxsb3ctYWxsIC0tIC0tdXBkYXRlXG4gKiBgYGBcbiAqXG4gKiBBZGRpdGlvbmFsbHksIG5ldyBzbmFwc2hvdHMgd2lsbCBvbmx5IGJlIGNyZWF0ZWQgd2hlbiB0aGlzIGZsYWcgaXMgcHJlc2VudC5cbiAqXG4gKiAjIyBQZXJtaXNzaW9uczpcbiAqXG4gKiBXaGVuIHJ1bm5pbmcgc25hcHNob3QgdGVzdHMsIHRoZSBgLS1hbGxvdy1yZWFkYCBwZXJtaXNzaW9uIG11c3QgYmUgZW5hYmxlZCwgb3JcbiAqIGVsc2UgYW55IGNhbGxzIHRvIGBhc3NlcnRTbmFwc2hvdGAgd2lsbCBmYWlsIGR1ZSB0byBpbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMuXG4gKiBBZGRpdGlvbmFsbHksIHdoZW4gdXBkYXRpbmcgc25hcHNob3RzLCB0aGUgYC0tYWxsb3ctd3JpdGVgIHBlcm1pc3Npb24gbXVzdCBhbHNvXG4gKiBiZSBlbmFibGVkLCBhcyB0aGlzIGlzIHJlcXVpcmVkIGluIG9yZGVyIHRvIHVwZGF0ZSBzbmFwc2hvdCBmaWxlcy5cbiAqXG4gKiBUaGUgYGFzc2VydFNuYXBzaG90YCBmdW5jdGlvbiB3aWxsIG9ubHkgYXR0ZW1wdCB0byByZWFkIGZyb20gYW5kIHdyaXRlIHRvXG4gKiBzbmFwc2hvdCBmaWxlcy4gQXMgc3VjaCwgdGhlIGFsbG93IGxpc3QgZm9yIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWBcbiAqIGNhbiBiZSBsaW1pdGVkIHRvIG9ubHkgaW5jbHVkZSBleGlzdGluZyBzbmFwc2hvdCBmaWxlcywgaWYgc28gZGVzaXJlZC5cbiAqXG4gKiAjIyBPcHRpb25zOlxuICpcbiAqIFRoZSBgYXNzZXJ0U25hcHNob3RgIGZ1bmN0aW9uIG9wdGlvbmFsbHkgYWNjZXB0cyBhbiBvcHRpb25zIG9iamVjdC5cbiAqXG4gKiBgYGB0c1xuICogLy8gZXhhbXBsZV90ZXN0LnRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTbmFwc2hvdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3Rpbmcvc25hcHNob3QudHNcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJpc1NuYXBzaG90TWF0Y2hcIiwgYXN5bmMgZnVuY3Rpb24gKHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAqICAgY29uc3QgYSA9IHtcbiAqICAgICBoZWxsbzogXCJ3b3JsZCFcIixcbiAqICAgICBleGFtcGxlOiAxMjMsXG4gKiAgIH07XG4gKiAgIGF3YWl0IGFzc2VydFNuYXBzaG90KHQsIGEsIHtcbiAqICAgICAvLyBvcHRpb25zXG4gKiAgIH0pO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gY29uZmlndXJlIGRlZmF1bHQgb3B0aW9ucyBmb3IgYGFzc2VydFNuYXBzaG90YC5cbiAqXG4gKiBgYGB0c1xuICogLy8gZXhhbXBsZV90ZXN0LnRzXG4gKiBpbXBvcnQgeyBjcmVhdGVBc3NlcnRTbmFwc2hvdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3Rpbmcvc25hcHNob3QudHNcIjtcbiAqXG4gKiBjb25zdCBhc3NlcnRTbmFwc2hvdCA9IGNyZWF0ZUFzc2VydFNuYXBzaG90KHtcbiAqICAgLy8gb3B0aW9uc1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBXaGVuIGNvbmZpZ3VyaW5nIGRlZmF1bHQgb3B0aW9ucyBsaWtlIHRoaXMsIHRoZSByZXN1bHRpbmcgYGFzc2VydFNuYXBzaG90YFxuICogZnVuY3Rpb24gd2lsbCBmdW5jdGlvbiB0aGUgc2FtZSBhcyB0aGUgZGVmYXVsdCBmdW5jdGlvbiBleHBvcnRlZCBmcm9tIHRoZVxuICogc25hcHNob3QgbW9kdWxlLiBJZiBwYXNzZWQgYW4gb3B0aW9uYWwgb3B0aW9ucyBvYmplY3QsIHRoaXMgd2lsbCB0YWtlIHByZWNlZGVuY2VcbiAqIG92ZXIgdGhlIGRlZmF1bHQgb3B0aW9ucywgd2hlcmUgdGhlIHZhbHVlIHByb3ZpZGVkIGZvciBhbiBvcHRpb24gZGlmZmVycy5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBcImV4dGVuZFwiIGFuIGBhc3NlcnRTbmFwc2hvdGAgZnVuY3Rpb24gd2hpY2ggaGFzIGJlZW5cbiAqIGNvbmZpZ3VyZWQgd2l0aCBkZWZhdWx0IG9wdGlvbnMuXG4gKlxuICogYGBgdHNcbiAqIC8vIGV4YW1wbGVfdGVzdC50c1xuICogaW1wb3J0IHsgY3JlYXRlQXNzZXJ0U25hcHNob3QgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL3NuYXBzaG90LnRzXCI7XG4gKiBpbXBvcnQgeyBzdHJpcEFuc2lDb2RlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZm10L2NvbG9ycy50c1wiO1xuICpcbiAqIGNvbnN0IGFzc2VydFNuYXBzaG90ID0gY3JlYXRlQXNzZXJ0U25hcHNob3Qoe1xuICogICBkaXI6IFwiLnNuYXBzXCIsXG4gKiB9KTtcbiAqXG4gKiBjb25zdCBhc3NlcnRNb25vY2hyb21lU25hcHNob3QgPSBjcmVhdGVBc3NlcnRTbmFwc2hvdDxzdHJpbmc+KFxuICogICB7IHNlcmlhbGl6ZXI6IHN0cmlwQW5zaUNvZGUgfSxcbiAqICAgYXNzZXJ0U25hcHNob3QsXG4gKiApO1xuICpcbiAqIERlbm8udGVzdChcImlzU25hcHNob3RNYXRjaFwiLCBhc3luYyBmdW5jdGlvbiAodCk6IFByb21pc2U8dm9pZD4ge1xuICogICBjb25zdCBhID0gXCJcXHgxYlszMm1UaGlzIGdyZWVuIHRleHQgaGFzIGhhZCBpdCdzIGNvbG91cnMgc3RyaXBwZWRcXHgxYlszOW1cIjtcbiAqICAgYXdhaXQgYXNzZXJ0TW9ub2Nocm9tZVNuYXBzaG90KHQsIGEpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogLy8gLnNuYXBzL2V4YW1wbGVfdGVzdC50cy5zbmFwXG4gKiBleHBvcnQgY29uc3Qgc25hcHNob3QgPSB7fTtcbiAqXG4gKiBzbmFwc2hvdFtgaXNTbmFwc2hvdE1hdGNoIDFgXSA9IGBUaGlzIGdyZWVuIHRleHQgaGFzIGhhZCBpdCdzIGNvbG91cnMgc3RyaXBwZWRgO1xuICogYGBgXG4gKlxuICogIyMgVmVyc2lvbiBDb250cm9sOlxuICpcbiAqIFNuYXBzaG90IHRlc3Rpbmcgd29ya3MgYmVzdCB3aGVuIGNoYW5nZXMgdG8gc25hcHNob3QgZmlsZXMgYXJlIGNvbW1pdHRlZFxuICogYWxvbmdzaWRlIG90aGVyIGNvZGUgY2hhbmdlcy4gVGhpcyBhbGxvd3MgZm9yIGNoYW5nZXMgdG8gcmVmZXJlbmNlIHNuYXBzaG90cyB0b1xuICogYmUgcmV2aWV3ZWQgYWxvbmcgc2lkZSB0aGUgY29kZSBjaGFuZ2VzIHRoYXQgY2F1c2VkIHRoZW0sIGFuZCBlbnN1cmVzIHRoYXQgd2hlblxuICogb3RoZXJzIHB1bGwgeW91ciBjaGFuZ2VzLCB0aGVpciB0ZXN0cyB3aWxsIHBhc3Mgd2l0aG91dCBuZWVkaW5nIHRvIHVwZGF0ZVxuICogc25hcHNob3RzIGxvY2FsbHkuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgvZnJvbV9maWxlX3VybC50c1wiO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi4vcGF0aC9wYXJzZS50c1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCIuLi9wYXRoL3Jlc29sdmUudHNcIjtcbmltcG9ydCB7IHRvRmlsZVVybCB9IGZyb20gXCIuLi9wYXRoL3RvX2ZpbGVfdXJsLnRzXCI7XG5pbXBvcnQgeyBlbnN1cmVGaWxlLCBlbnN1cmVGaWxlU3luYyB9IGZyb20gXCIuLi9mcy9lbnN1cmVfZmlsZS50c1wiO1xuaW1wb3J0IHsgYm9sZCwgZ3JlZW4sIHJlZCB9IGZyb20gXCIuLi9mbXQvY29sb3JzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vYXNzZXJ0L2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi4vYXNzZXJ0L2Fzc2VydGlvbl9lcnJvci50c1wiO1xuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi4vYXNzZXJ0L2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiLi4vYXNzZXJ0L2Fzc2VydF9lcXVhbHMudHNcIjtcblxuY29uc3QgU05BUFNIT1RfRElSID0gXCJfX3NuYXBzaG90c19fXCI7XG5jb25zdCBTTkFQU0hPVF9FWFQgPSBcInNuYXBcIjtcblxuZXhwb3J0IHR5cGUgU25hcHNob3RNb2RlID0gXCJhc3NlcnRcIiB8IFwidXBkYXRlXCI7XG5cbmV4cG9ydCB0eXBlIFNuYXBzaG90T3B0aW9uczxUID0gdW5rbm93bj4gPSB7XG4gIC8qKlxuICAgKiBTbmFwc2hvdCBvdXRwdXQgZGlyZWN0b3J5LiBTbmFwc2hvdCBmaWxlcyB3aWxsIGJlIHdyaXR0ZW4gdG8gdGhpcyBkaXJlY3RvcnkuXG4gICAqIFRoaXMgY2FuIGJlIHJlbGF0aXZlIHRvIHRoZSB0ZXN0IGRpcmVjdG9yeSBvciBhbiBhYnNvbHV0ZSBwYXRoLlxuICAgKlxuICAgKiBJZiBib3RoIGBkaXJgIGFuZCBgcGF0aGAgYXJlIHNwZWNpZmllZCwgdGhlIGBkaXJgIG9wdGlvbiB3aWxsIGJlIGlnbm9yZWQgYW5kXG4gICAqIHRoZSBgcGF0aGAgb3B0aW9uIHdpbGwgYmUgaGFuZGxlZCBhcyBub3JtYWwuXG4gICAqL1xuICBkaXI/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBTbmFwc2hvdCBtb2RlLiBEZWZhdWx0cyB0byBgYXNzZXJ0YCwgdW5sZXNzIHRoZSBgLXVgIG9yIGAtLXVwZGF0ZWAgZmxhZyBpc1xuICAgKiBwYXNzZWQsIGluIHdoaWNoIGNhc2UgdGhpcyB3aWxsIGJlIHNldCB0byBgdXBkYXRlYC4gVGhpcyBvcHRpb24gdGFrZXMgaGlnaGVyXG4gICAqIHByaW9yaXR5IHRoYW4gdGhlIHVwZGF0ZSBmbGFnLiBJZiB0aGUgYC0tdXBkYXRlYCBmbGFnIGlzIHBhc3NlZCwgaXQgd2lsbCBiZVxuICAgKiBpZ25vcmVkIGlmIHRoZSBgbW9kZWAgb3B0aW9uIGlzIHNldC5cbiAgICovXG4gIG1vZGU/OiBTbmFwc2hvdE1vZGU7XG4gIC8qKlxuICAgKiBGYWlsdXJlIG1lc3NhZ2UgdG8gbG9nIHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gU3BlY2lmeWluZyB0aGlzIG9wdGlvbiB3aWxsXG4gICAqIGNhdXNlIHRoZSBkaWZmIG5vdCB0byBiZSBsb2dnZWQuXG4gICAqL1xuICBtc2c/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoZSBzbmFwc2hvdCB0byB1c2UgaW4gdGhlIHNuYXBzaG90IGZpbGUuXG4gICAqL1xuICBuYW1lPzogc3RyaW5nO1xuICAvKipcbiAgICogU25hcHNob3Qgb3V0cHV0IHBhdGguIFRoZSBzbmFwc2hvdCB3aWxsIGJlIHdyaXR0ZW4gdG8gdGhpcyBmaWxlLiBUaGlzIGNhbiBiZVxuICAgKiBhIHBhdGggcmVsYXRpdmUgdG8gdGhlIHRlc3QgZGlyZWN0b3J5IG9yIGFuIGFic29sdXRlIHBhdGguXG4gICAqXG4gICAqIElmIGJvdGggYGRpcmAgYW5kIGBwYXRoYCBhcmUgc3BlY2lmaWVkLCB0aGUgYGRpcmAgb3B0aW9uIHdpbGwgYmUgaWdub3JlZCBhbmRcbiAgICogdGhlIGBwYXRoYCBvcHRpb24gd2lsbCBiZSBoYW5kbGVkIGFzIG5vcm1hbC5cbiAgICovXG4gIHBhdGg/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byB1c2Ugd2hlbiBzZXJpYWxpemluZyB0aGUgc25hcHNob3QuXG4gICAqL1xuICBzZXJpYWxpemVyPzogKGFjdHVhbDogVCkgPT4gc3RyaW5nO1xufTtcblxuZnVuY3Rpb24gZ2V0RXJyb3JNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9uczogU25hcHNob3RPcHRpb25zKSB7XG4gIHJldHVybiB0eXBlb2Ygb3B0aW9ucy5tc2cgPT09IFwic3RyaW5nXCIgPyBvcHRpb25zLm1zZyA6IG1lc3NhZ2U7XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXJpYWxpemVyIGZvciBgYXNzZXJ0U25hcHNob3RgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKGFjdHVhbDogdW5rbm93bik6IHN0cmluZztcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemU8VD4oYWN0dWFsOiBUKTogc3RyaW5nO1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZShhY3R1YWw6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gRGVuby5pbnNwZWN0KGFjdHVhbCwge1xuICAgIGRlcHRoOiBJbmZpbml0eSxcbiAgICBzb3J0ZWQ6IHRydWUsXG4gICAgdHJhaWxpbmdDb21tYTogdHJ1ZSxcbiAgICBjb21wYWN0OiBmYWxzZSxcbiAgICBpdGVyYWJsZUxpbWl0OiBJbmZpbml0eSxcbiAgICBzdHJBYmJyZXZpYXRlU2l6ZTogSW5maW5pdHksXG4gICAgYnJlYWtMZW5ndGg6IEluZmluaXR5LFxuICAgIGVzY2FwZVNlcXVlbmNlczogZmFsc2UsXG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgc3RyaW5nIHRvIGEgdmFsaWQgSmF2YVNjcmlwdCBzdHJpbmcgd2hpY2ggY2FuIGJlIHdyYXBwZWQgaW4gYmFja3RpY2tzLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogXCJzcGVjaWFsIGNoYXJhY3RlcnMgKFxcIGAgJCkgd2lsbCBiZSBlc2NhcGVkXCIgLT4gXCJzcGVjaWFsIGNoYXJhY3RlcnMgKFxcXFwgXFxgIFxcJCkgd2lsbCBiZSBlc2NhcGVkXCJcbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nRm9ySnMoc3RyOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC9cXFxcL2csIFwiXFxcXFxcXFxcIilcbiAgICAucmVwbGFjZSgvYC9nLCBcIlxcXFxgXCIpXG4gICAgLnJlcGxhY2UoL1xcJC9nLCBcIlxcXFwkXCIpO1xufVxuXG5sZXQgX21vZGU6IFNuYXBzaG90TW9kZTtcbi8qKlxuICogR2V0IHRoZSBzbmFwc2hvdCBtb2RlLlxuICovXG5mdW5jdGlvbiBnZXRNb2RlKG9wdGlvbnM6IFNuYXBzaG90T3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5tb2RlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubW9kZTtcbiAgfSBlbHNlIGlmIChfbW9kZSkge1xuICAgIHJldHVybiBfbW9kZTtcbiAgfSBlbHNlIHtcbiAgICBfbW9kZSA9IERlbm8uYXJncy5zb21lKChhcmcpID0+IGFyZyA9PT0gXCItLXVwZGF0ZVwiIHx8IGFyZyA9PT0gXCItdVwiKVxuICAgICAgPyBcInVwZGF0ZVwiXG4gICAgICA6IFwiYXNzZXJ0XCI7XG4gICAgcmV0dXJuIF9tb2RlO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIGB0cnVlYCB3aGVuIHNuYXBzaG90IG1vZGUgaXMgYHVwZGF0ZWAuXG4gKi9cbmZ1bmN0aW9uIGdldElzVXBkYXRlKG9wdGlvbnM6IFNuYXBzaG90T3B0aW9ucykge1xuICByZXR1cm4gZ2V0TW9kZShvcHRpb25zKSA9PT0gXCJ1cGRhdGVcIjtcbn1cblxuY2xhc3MgQXNzZXJ0U25hcHNob3RDb250ZXh0IHtcbiAgc3RhdGljIGNvbnRleHRzID0gbmV3IE1hcDxzdHJpbmcsIEFzc2VydFNuYXBzaG90Q29udGV4dD4oKTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgQXNzZXJ0U25hcHNob3RDb250ZXh0YC4gVGhpcyB3aWxsIGJlIHJldHJpZXZlZCBmcm9tXG4gICAqIGEgY2FjaGUgaWYgYW4gaW5zdGFuY2Ugd2FzIGFscmVhZHkgY3JlYXRlZCBmb3IgYSBnaXZlbiBzbmFwc2hvdCBmaWxlIHBhdGguXG4gICAqL1xuICBzdGF0aWMgZnJvbU9wdGlvbnMoXG4gICAgdGVzdENvbnRleHQ6IERlbm8uVGVzdENvbnRleHQsXG4gICAgb3B0aW9uczogU25hcHNob3RPcHRpb25zLFxuICApOiBBc3NlcnRTbmFwc2hvdENvbnRleHQge1xuICAgIGxldCBwYXRoOiBzdHJpbmc7XG4gICAgY29uc3QgdGVzdEZpbGVQYXRoID0gZnJvbUZpbGVVcmwodGVzdENvbnRleHQub3JpZ2luKTtcbiAgICBjb25zdCB7IGRpciwgYmFzZSB9ID0gcGFyc2UodGVzdEZpbGVQYXRoKTtcbiAgICBpZiAob3B0aW9ucy5wYXRoKSB7XG4gICAgICBwYXRoID0gcmVzb2x2ZShkaXIsIG9wdGlvbnMucGF0aCk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmRpcikge1xuICAgICAgcGF0aCA9IHJlc29sdmUoZGlyLCBvcHRpb25zLmRpciwgYCR7YmFzZX0uJHtTTkFQU0hPVF9FWFR9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGggPSByZXNvbHZlKGRpciwgU05BUFNIT1RfRElSLCBgJHtiYXNlfS4ke1NOQVBTSE9UX0VYVH1gKTtcbiAgICB9XG5cbiAgICBsZXQgY29udGV4dCA9IHRoaXMuY29udGV4dHMuZ2V0KHBhdGgpO1xuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICByZXR1cm4gY29udGV4dDtcbiAgICB9XG5cbiAgICBjb250ZXh0ID0gbmV3IHRoaXModG9GaWxlVXJsKHBhdGgpKTtcbiAgICB0aGlzLmNvbnRleHRzLnNldChwYXRoLCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfVxuXG4gICN0ZWFyZG93blJlZ2lzdGVyZWQgPSBmYWxzZTtcbiAgI2N1cnJlbnRTbmFwc2hvdHM6IE1hcDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQ7XG4gICN1cGRhdGVkU25hcHNob3RzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgI3NuYXBzaG90Q291bnRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgI3NuYXBzaG90c1VwZGF0ZWQgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAjc25hcHNob3RGaWxlVXJsOiBVUkw7XG4gIHNuYXBzaG90VXBkYXRlUXVldWUgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKHNuYXBzaG90RmlsZVVybDogVVJMKSB7XG4gICAgdGhpcy4jc25hcHNob3RGaWxlVXJsID0gc25hcHNob3RGaWxlVXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCBgdGhpcy4jY3VycmVudFNuYXBzaG90c2AgaGFzIGJlZW4gaW5pdGlhbGl6ZWQgYW5kIHRoZW4gcmV0dXJucyBpdC5cbiAgICpcbiAgICogU2hvdWxkIG9ubHkgYmUgY2FsbGVkIHdoZW4gYHRoaXMuI2N1cnJlbnRTbmFwc2hvdHNgIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWQuXG4gICAqL1xuICAjZ2V0Q3VycmVudFNuYXBzaG90c0luaXRpYWxpemVkKCkge1xuICAgIGFzc2VydChcbiAgICAgIHRoaXMuI2N1cnJlbnRTbmFwc2hvdHMsXG4gICAgICBcIlNuYXBzaG90IHdhcyBub3QgaW5pdGlhbGl6ZWQuIFRoaXMgaXMgYSBidWcgaW4gYGFzc2VydFNuYXBzaG90YC5cIixcbiAgICApO1xuICAgIHJldHVybiB0aGlzLiNjdXJyZW50U25hcHNob3RzO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlIHVwZGF0ZXMgdG8gdGhlIHNuYXBzaG90IGZpbGUgYW5kIGxvZyBzdGF0aXN0aWNzLlxuICAgKi9cbiAgI3RlYXJkb3duID0gKCkgPT4ge1xuICAgIGNvbnN0IGJ1ZiA9IFtcImV4cG9ydCBjb25zdCBzbmFwc2hvdCA9IHt9O1wiXTtcbiAgICBjb25zdCBjdXJyZW50U25hcHNob3RzID0gdGhpcy4jZ2V0Q3VycmVudFNuYXBzaG90c0luaXRpYWxpemVkKCk7XG4gICAgY29uc3QgY3VycmVudFNuYXBzaG90TmFtZXMgPSBBcnJheS5mcm9tKGN1cnJlbnRTbmFwc2hvdHMua2V5cygpKTtcbiAgICBjb25zdCByZW1vdmVkU25hcHNob3ROYW1lcyA9IGN1cnJlbnRTbmFwc2hvdE5hbWVzLmZpbHRlcigobmFtZSkgPT5cbiAgICAgICF0aGlzLnNuYXBzaG90VXBkYXRlUXVldWUuaW5jbHVkZXMobmFtZSlcbiAgICApO1xuICAgIHRoaXMuc25hcHNob3RVcGRhdGVRdWV1ZS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkU25hcHNob3QgPSB0aGlzLiN1cGRhdGVkU25hcHNob3RzLmdldChuYW1lKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRTbmFwc2hvdCA9IGN1cnJlbnRTbmFwc2hvdHMuZ2V0KG5hbWUpO1xuICAgICAgbGV0IGZvcm1hdHRlZFNuYXBzaG90OiBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIHVwZGF0ZWRTbmFwc2hvdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmb3JtYXR0ZWRTbmFwc2hvdCA9IHVwZGF0ZWRTbmFwc2hvdDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRTbmFwc2hvdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmb3JtYXR0ZWRTbmFwc2hvdCA9IGN1cnJlbnRTbmFwc2hvdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgb2NjdXJzIHdoZW4gYGFzc2VydFNuYXBzaG90YCBpcyBjYWxsZWQgaW4gXCJhc3NlcnRcIiBtb2RlIGJ1dFxuICAgICAgICAvLyB0aGUgc25hcHNob3QgZG9lc24ndCBleGlzdCBhbmQgYGFzc2VydFNuYXBzaG90YCBpcyBhbHNvIGNhbGxlZCBpblxuICAgICAgICAvLyBcInVwZGF0ZVwiIG1vZGUuIEluIHRoaXMgY2FzZSwgd2UgaGF2ZSBub3RoaW5nIHRvIHdyaXRlIHRvIHRoZVxuICAgICAgICAvLyBzbmFwc2hvdCBmaWxlIHNvIHdlIGNhbiBqdXN0IGV4aXQgZWFybHlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9ybWF0dGVkU25hcHNob3QgPSBlc2NhcGVTdHJpbmdGb3JKcyhmb3JtYXR0ZWRTbmFwc2hvdCk7XG4gICAgICBmb3JtYXR0ZWRTbmFwc2hvdCA9IGZvcm1hdHRlZFNuYXBzaG90LmluY2x1ZGVzKFwiXFxuXCIpXG4gICAgICAgID8gYFxcbiR7Zm9ybWF0dGVkU25hcHNob3R9XFxuYFxuICAgICAgICA6IGZvcm1hdHRlZFNuYXBzaG90O1xuICAgICAgY29uc3QgZm9ybWF0dGVkTmFtZSA9IGVzY2FwZVN0cmluZ0ZvckpzKG5hbWUpO1xuICAgICAgYnVmLnB1c2goYFxcbnNuYXBzaG90W1xcYCR7Zm9ybWF0dGVkTmFtZX1cXGBdID0gXFxgJHtmb3JtYXR0ZWRTbmFwc2hvdH1cXGA7YCk7XG4gICAgfSk7XG4gICAgY29uc3Qgc25hcHNob3RGaWxlUGF0aCA9IGZyb21GaWxlVXJsKHRoaXMuI3NuYXBzaG90RmlsZVVybCk7XG4gICAgZW5zdXJlRmlsZVN5bmMoc25hcHNob3RGaWxlUGF0aCk7XG4gICAgRGVuby53cml0ZVRleHRGaWxlU3luYyhzbmFwc2hvdEZpbGVQYXRoLCBidWYuam9pbihcIlxcblwiKSArIFwiXFxuXCIpO1xuXG4gICAgY29uc3QgdXBkYXRlZCA9IHRoaXMuZ2V0VXBkYXRlZENvdW50KCk7XG4gICAgaWYgKHVwZGF0ZWQgPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgZ3JlZW4oXG4gICAgICAgICAgYm9sZChcbiAgICAgICAgICAgIGBcXG4gPiAke3VwZGF0ZWR9ICR7XG4gICAgICAgICAgICAgIHVwZGF0ZWQgPT09IDEgPyBcInNuYXBzaG90XCIgOiBcInNuYXBzaG90c1wiXG4gICAgICAgICAgICB9IHVwZGF0ZWQuYCxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZCA9IHJlbW92ZWRTbmFwc2hvdE5hbWVzLmxlbmd0aDtcbiAgICBpZiAocmVtb3ZlZCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICByZWQoXG4gICAgICAgICAgYm9sZChcbiAgICAgICAgICAgIGBcXG4gPiAke3JlbW92ZWR9ICR7XG4gICAgICAgICAgICAgIHJlbW92ZWQgPT09IDEgPyBcInNuYXBzaG90XCIgOiBcInNuYXBzaG90c1wiXG4gICAgICAgICAgICB9IHJlbW92ZWQuYCxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3Qgc25hcHNob3ROYW1lIG9mIHJlbW92ZWRTbmFwc2hvdE5hbWVzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIHJlZChib2xkKGAgICDigKIgJHtzbmFwc2hvdE5hbWV9YCkpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBgdGhpcy4jY3VycmVudFNuYXBzaG90c2AgYW5kIGlmIG5lY2Vzc2FyeSwgdHJpZXMgdG8gaW5pdGlhbGl6ZSBpdCBieSByZWFkaW5nIGV4aXN0aW5nXG4gICAqIHNuYXBzaG90cyBmcm9tIHRoZSBzbmFwc2hvdCBmaWxlLiBJZiB0aGUgc25hcHNob3QgbW9kZSBpcyBgdXBkYXRlYCBhbmQgdGhlIHNuYXBzaG90IGZpbGUgZG9lc1xuICAgKiBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAqL1xuICBhc3luYyAjcmVhZFNuYXBzaG90RmlsZShvcHRpb25zOiBTbmFwc2hvdE9wdGlvbnMpIHtcbiAgICBpZiAodGhpcy4jY3VycmVudFNuYXBzaG90cykge1xuICAgICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRTbmFwc2hvdHM7XG4gICAgfVxuXG4gICAgaWYgKGdldElzVXBkYXRlKG9wdGlvbnMpKSB7XG4gICAgICBhd2FpdCBlbnN1cmVGaWxlKGZyb21GaWxlVXJsKHRoaXMuI3NuYXBzaG90RmlsZVVybCkpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzbmFwc2hvdEZpbGVVcmwgPSB0aGlzLiNzbmFwc2hvdEZpbGVVcmwudG9TdHJpbmcoKTtcbiAgICAgIGNvbnN0IHsgc25hcHNob3QgfSA9IGF3YWl0IGltcG9ydChzbmFwc2hvdEZpbGVVcmwpO1xuICAgICAgdGhpcy4jY3VycmVudFNuYXBzaG90cyA9IHR5cGVvZiBzbmFwc2hvdCA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICA/IG5ldyBNYXAoKVxuICAgICAgICA6IG5ldyBNYXAoXG4gICAgICAgICAgT2JqZWN0LmVudHJpZXMoc25hcHNob3QpLm1hcCgoW25hbWUsIHNuYXBzaG90XSkgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzbmFwc2hvdCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgICAgICAgZ2V0RXJyb3JNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgYENvcnJ1cHQgc25hcHNob3Q6XFxuXFx0KCR7bmFtZX0pXFxuXFx0JHtzbmFwc2hvdEZpbGVVcmx9YCxcbiAgICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgIHNuYXBzaG90LmluY2x1ZGVzKFwiXFxuXCIpID8gc25hcHNob3Quc2xpY2UoMSwgLTEpIDogc25hcHNob3QsXG4gICAgICAgICAgICBdO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRTbmFwc2hvdHM7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBUeXBlRXJyb3IgJiZcbiAgICAgICAgZXJyb3IubWVzc2FnZS5zdGFydHNXaXRoKFwiTW9kdWxlIG5vdCBmb3VuZFwiKVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgICBnZXRFcnJvck1lc3NhZ2UoXG4gICAgICAgICAgICBcIk1pc3Npbmcgc25hcHNob3QgZmlsZS5cIixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIHRlYXJkb3duIGZ1bmN0aW9uIHdoaWNoIHdyaXRlcyB0aGUgc25hcHNob3QgZmlsZSB0byBkaXNrIGFuZCBsb2dzIHRoZSBudW1iZXJcbiAgICogb2Ygc25hcHNob3RzIHVwZGF0ZWQgYWZ0ZXIgYWxsIHRlc3RzIGhhdmUgcnVuLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBjYW4gc2FmZWx5IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBhbmQgd2lsbCBvbmx5IHJlZ2lzdGVyIHRoZSB0ZWFyZG93blxuICAgKiBmdW5jdGlvbiBvbmNlIGluIGEgY29udGV4dC5cbiAgICovXG4gIHB1YmxpYyByZWdpc3RlclRlYXJkb3duKCkge1xuICAgIGlmICghdGhpcy4jdGVhcmRvd25SZWdpc3RlcmVkKSB7XG4gICAgICBnbG9iYWxUaGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdGVhcmRvd24pO1xuICAgICAgdGhpcy4jdGVhcmRvd25SZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIHNuYXBzaG90cyB3aGljaCBoYXZlIGJlZW4gY3JlYXRlZCB3aXRoIHRoZSBzYW1lIG5hbWUgYW5kIGluY3JlbWVudHNcbiAgICogdGhlIGNvdW50IGJ5IDEuXG4gICAqL1xuICBwdWJsaWMgZ2V0Q291bnQoc25hcHNob3ROYW1lOiBzdHJpbmcpIHtcbiAgICBsZXQgY291bnQgPSB0aGlzLiNzbmFwc2hvdENvdW50cy5nZXQoc25hcHNob3ROYW1lKSB8fCAwO1xuICAgIHRoaXMuI3NuYXBzaG90Q291bnRzLnNldChzbmFwc2hvdE5hbWUsICsrY291bnQpO1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gZXhpc3Rpbmcgc25hcHNob3QgYnkgbmFtZSBvciByZXR1cm5zIGB1bmRlZmluZWRgIGlmIHRoZSBzbmFwc2hvdCBkb2VzIG5vdCBleGlzdC5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRTbmFwc2hvdChzbmFwc2hvdE5hbWU6IHN0cmluZywgb3B0aW9uczogU25hcHNob3RPcHRpb25zKSB7XG4gICAgY29uc3Qgc25hcHNob3RzID0gYXdhaXQgdGhpcy4jcmVhZFNuYXBzaG90RmlsZShvcHRpb25zKTtcbiAgICByZXR1cm4gc25hcHNob3RzLmdldChzbmFwc2hvdE5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIHNuYXBzaG90IGJ5IG5hbWUuIFVwZGF0ZXMgd2lsbCBiZSB3cml0dGVuIHRvIHRoZSBzbmFwc2hvdCBmaWxlIHdoZW4gYWxsIHRlc3RzXG4gICAqIGhhdmUgcnVuLiBJZiB0aGUgc25hcHNob3QgZG9lcyBub3QgZXhpc3QsIGl0IHdpbGwgYmUgY3JlYXRlZC5cbiAgICpcbiAgICogU2hvdWxkIG9ubHkgYmUgY2FsbGVkIHdoZW4gbW9kZSBpcyBgdXBkYXRlYC5cbiAgICovXG4gIHB1YmxpYyB1cGRhdGVTbmFwc2hvdChzbmFwc2hvdE5hbWU6IHN0cmluZywgc25hcHNob3Q6IHN0cmluZykge1xuICAgIGlmICghdGhpcy4jc25hcHNob3RzVXBkYXRlZC5pbmNsdWRlcyhzbmFwc2hvdE5hbWUpKSB7XG4gICAgICB0aGlzLiNzbmFwc2hvdHNVcGRhdGVkLnB1c2goc25hcHNob3ROYW1lKTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudFNuYXBzaG90cyA9IHRoaXMuI2dldEN1cnJlbnRTbmFwc2hvdHNJbml0aWFsaXplZCgpO1xuICAgIGlmICghY3VycmVudFNuYXBzaG90cy5oYXMoc25hcHNob3ROYW1lKSkge1xuICAgICAgY3VycmVudFNuYXBzaG90cy5zZXQoc25hcHNob3ROYW1lLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICB0aGlzLiN1cGRhdGVkU25hcHNob3RzLnNldChzbmFwc2hvdE5hbWUsIHNuYXBzaG90KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiB1cGRhdGVkIHNuYXBzaG90cy5cbiAgICovXG4gIHB1YmxpYyBnZXRVcGRhdGVkQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3NuYXBzaG90c1VwZGF0ZWQubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHNuYXBzaG90IHRvIHRoZSB1cGRhdGUgcXVldWUuXG4gICAqXG4gICAqIFRyYWNrcyB0aGUgb3JkZXIgaW4gd2hpY2ggc25hcHNob3RzIHdlcmUgY3JlYXRlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHdyaXR0ZW4gdG9cbiAgICogdGhlIHNuYXBzaG90IGZpbGUgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAqXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgd2l0aCBlYWNoIHNuYXBzaG90LCByZWdhcmRsZXNzIG9mIHRoZSBtb2RlLCBhcyBhIGZ1dHVyZSBjYWxsIHRvXG4gICAqIGBhc3NlcnRTbmFwc2hvdGAgY291bGQgY2F1c2UgdXBkYXRlcyB0byBiZSB3cml0dGVuIHRvIHRoZSBzbmFwc2hvdCBmaWxlIGlmIHRoZVxuICAgKiBgdXBkYXRlYCBtb2RlIGlzIHBhc3NlZCBpbiB0aGUgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBwdXNoU25hcHNob3RUb1VwZGF0ZVF1ZXVlKHNuYXBzaG90TmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5zbmFwc2hvdFVwZGF0ZVF1ZXVlLnB1c2goc25hcHNob3ROYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBleGlzdCBzbmFwc2hvdFxuICAgKi9cbiAgcHVibGljIGhhc1NuYXBzaG90KHNuYXBzaG90TmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI2N1cnJlbnRTbmFwc2hvdHNcbiAgICAgID8gdGhpcy4jY3VycmVudFNuYXBzaG90cy5oYXMoc25hcHNob3ROYW1lKVxuICAgICAgOiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbWF0Y2hlcyBhIHNuYXBzaG90LiBJZiB0aGUgc25hcHNob3QgYW5kIGBhY3R1YWxgIGRvXG4gKiBub3QgYSBtYXRjaCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTbmFwc2hvdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3Rpbmcvc25hcHNob3QudHNcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJzbmFwc2hvdFwiLCBhc3luYyAodGVzdCkgPT4ge1xuICogIGF3YWl0IGFzc2VydFNuYXBzaG90PG51bWJlcj4odGVzdCwgMik7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNzZXJ0U25hcHNob3Q8VD4oXG4gIGNvbnRleHQ6IERlbm8uVGVzdENvbnRleHQsXG4gIGFjdHVhbDogVCxcbiAgb3B0aW9uczogU25hcHNob3RPcHRpb25zPFQ+LFxuKTogUHJvbWlzZTx2b2lkPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRTbmFwc2hvdDxUPihcbiAgY29udGV4dDogRGVuby5UZXN0Q29udGV4dCxcbiAgYWN0dWFsOiBULFxuICBtZXNzYWdlPzogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRTbmFwc2hvdChcbiAgY29udGV4dDogRGVuby5UZXN0Q29udGV4dCxcbiAgYWN0dWFsOiB1bmtub3duLFxuICBtc2dPck9wdHM/OiBzdHJpbmcgfCBTbmFwc2hvdE9wdGlvbnM8dW5rbm93bj4sXG4pIHtcbiAgY29uc3Qgb3B0aW9ucyA9IGdldE9wdGlvbnMoKTtcbiAgY29uc3QgYXNzZXJ0U25hcHNob3RDb250ZXh0ID0gQXNzZXJ0U25hcHNob3RDb250ZXh0LmZyb21PcHRpb25zKFxuICAgIGNvbnRleHQsXG4gICAgb3B0aW9ucyxcbiAgKTtcbiAgY29uc3QgdGVzdE5hbWUgPSBnZXRUZXN0TmFtZShjb250ZXh0LCBvcHRpb25zKTtcbiAgY29uc3QgY291bnQgPSBhc3NlcnRTbmFwc2hvdENvbnRleHQuZ2V0Q291bnQodGVzdE5hbWUpO1xuICBjb25zdCBuYW1lID0gYCR7dGVzdE5hbWV9ICR7Y291bnR9YDtcbiAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCBhc3NlcnRTbmFwc2hvdENvbnRleHQuZ2V0U25hcHNob3QoXG4gICAgbmFtZSxcbiAgICBvcHRpb25zLFxuICApO1xuXG4gIGFzc2VydFNuYXBzaG90Q29udGV4dC5wdXNoU25hcHNob3RUb1VwZGF0ZVF1ZXVlKG5hbWUpO1xuICBjb25zdCBfc2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemVyIHx8IHNlcmlhbGl6ZTtcbiAgY29uc3QgX2FjdHVhbCA9IF9zZXJpYWxpemUoYWN0dWFsKTtcbiAgaWYgKGdldElzVXBkYXRlKG9wdGlvbnMpKSB7XG4gICAgYXNzZXJ0U25hcHNob3RDb250ZXh0LnJlZ2lzdGVyVGVhcmRvd24oKTtcbiAgICBpZiAoIWVxdWFsKF9hY3R1YWwsIHNuYXBzaG90KSkge1xuICAgICAgYXNzZXJ0U25hcHNob3RDb250ZXh0LnVwZGF0ZVNuYXBzaG90KG5hbWUsIF9hY3R1YWwpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoXG4gICAgICAhYXNzZXJ0U25hcHNob3RDb250ZXh0Lmhhc1NuYXBzaG90KG5hbWUpIHx8XG4gICAgICB0eXBlb2Ygc25hcHNob3QgPT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgZ2V0RXJyb3JNZXNzYWdlKGBNaXNzaW5nIHNuYXBzaG90OiAke25hbWV9YCwgb3B0aW9ucyksXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZXF1YWwoX2FjdHVhbCwgc25hcHNob3QpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBtZXNzYWdlID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXNlc011bHRpbGluZURpZmYgPSBfYWN0dWFsLmluY2x1ZGVzKFwiXFxuXCIpO1xuICAgICAgaWYgKHVzZXNNdWx0aWxpbmVEaWZmKSB7XG4gICAgICAgIGFzc2VydEVxdWFscyh0cnVlLCBmYWxzZSwgdW5kZWZpbmVkLCB7XG4gICAgICAgICAgZm9ybWF0dGVyOiAodikgPT4gdiA/IF9hY3R1YWwgOiBzbmFwc2hvdCxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NlcnRFcXVhbHMoX2FjdHVhbCwgc25hcHNob3QpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICAgICAgbWVzc2FnZSA9IGUubWVzc2FnZS5yZXBsYWNlKFxuICAgICAgICAgIFwiVmFsdWVzIGFyZSBub3QgZXF1YWwuXCIsXG4gICAgICAgICAgXCJTbmFwc2hvdCBkb2VzIG5vdCBtYXRjaDpcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgZ2V0RXJyb3JNZXNzYWdlKG1lc3NhZ2UsIG9wdGlvbnMpLFxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPcHRpb25zKCk6IFNuYXBzaG90T3B0aW9ucyB7XG4gICAgaWYgKHR5cGVvZiBtc2dPck9wdHMgPT09IFwib2JqZWN0XCIgJiYgbXNnT3JPcHRzICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbXNnT3JPcHRzO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtc2c6IG1zZ09yT3B0cyxcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGdldFRlc3ROYW1lKFxuICAgIGNvbnRleHQ6IERlbm8uVGVzdENvbnRleHQsXG4gICAgb3B0aW9ucz86IFNuYXBzaG90T3B0aW9ucyxcbiAgKTogc3RyaW5nIHtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5hbWUpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLm5hbWU7XG4gICAgfSBlbHNlIGlmIChjb250ZXh0LnBhcmVudCkge1xuICAgICAgcmV0dXJuIGAke2dldFRlc3ROYW1lKGNvbnRleHQucGFyZW50KX0gPiAke2NvbnRleHQubmFtZX1gO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dC5uYW1lO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBc3NlcnRTbmFwc2hvdDxUPihcbiAgb3B0aW9uczogU25hcHNob3RPcHRpb25zPFQ+LFxuICBiYXNlQXNzZXJ0U25hcHNob3Q6IHR5cGVvZiBhc3NlcnRTbmFwc2hvdCA9IGFzc2VydFNuYXBzaG90LFxuKTogdHlwZW9mIGFzc2VydFNuYXBzaG90IHtcbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIF9hc3NlcnRTbmFwc2hvdChcbiAgICBjb250ZXh0OiBEZW5vLlRlc3RDb250ZXh0LFxuICAgIGFjdHVhbDogVCxcbiAgICBtZXNzYWdlT3JPcHRpb25zPzogc3RyaW5nIHwgU25hcHNob3RPcHRpb25zPFQ+LFxuICApIHtcbiAgICBjb25zdCBtZXJnZWRPcHRpb25zOiBTbmFwc2hvdE9wdGlvbnM8VD4gPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgLi4uKHR5cGVvZiBtZXNzYWdlT3JPcHRpb25zID09PSBcInN0cmluZ1wiXG4gICAgICAgID8ge1xuICAgICAgICAgIG1zZzogbWVzc2FnZU9yT3B0aW9ucyxcbiAgICAgICAgfVxuICAgICAgICA6IG1lc3NhZ2VPck9wdGlvbnMpLFxuICAgIH07XG5cbiAgICBhd2FpdCBiYXNlQXNzZXJ0U25hcHNob3QoY29udGV4dCwgYWN0dWFsLCBtZXJnZWRPcHRpb25zKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0lDLEdBRUQsU0FBUyxXQUFXLFFBQVEsMkJBQTJCO0FBQ3ZELFNBQVMsS0FBSyxRQUFRLG1CQUFtQjtBQUN6QyxTQUFTLE9BQU8sUUFBUSxxQkFBcUI7QUFDN0MsU0FBUyxTQUFTLFFBQVEseUJBQXlCO0FBQ25ELFNBQVMsVUFBVSxFQUFFLGNBQWMs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
// denoCacheMetadata=18241758267316080861,7638506376698011874