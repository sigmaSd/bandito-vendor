import { DENO_DEPLOYMENT_ID } from "./build_id.ts";
import { colors } from "./deps.ts";
export async function startServer(handler, opts) {
  if (!opts.onListen) {
    opts.onListen = (params)=>{
      const pathname = opts.basePath + "/";
      const https = !!(opts.key && opts.cert);
      const protocol = https ? "https:" : "http:";
      const address = colors.cyan(`${protocol}//localhost:${params.port}${pathname}`);
      const localLabel = colors.bold("Local:");
      // Print more concise output for deploy logs
      if (DENO_DEPLOYMENT_ID) {
        console.log(colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121), `${localLabel} ${address}`);
      } else {
        console.log();
        console.log(colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121));
        console.log(`    ${localLabel} ${address}\n`);
      }
    };
  }
  const portEnv = Deno.env.get("PORT");
  if (portEnv !== undefined) {
    opts.port ??= parseInt(portEnv, 10);
  }
  if (opts.port) {
    await bootServer(handler, opts);
  } else {
    // No port specified, check for a free port. Instead of picking just
    // any port we'll check if the next one is free for UX reasons.
    // That way the user only needs to increment a number when running
    // multiple apps vs having to remember completely different ports.
    let firstError;
    for(let port = 8000; port < 8020; port++){
      try {
        await bootServer(handler, {
          ...opts,
          port
        });
        firstError = undefined;
        break;
      } catch (err) {
        if (err instanceof Deno.errors.AddrInUse) {
          // Throw first EADDRINUSE error
          // if no port is free
          if (!firstError) {
            firstError = err;
          }
          continue;
        }
        throw err;
      }
    }
    if (firstError) {
      throw firstError;
    }
  }
}
async function bootServer(handler, opts) {
  // @ts-ignore Ignore type error when type checking with Deno versions
  if (typeof Deno.serve === "function") {
    // @ts-ignore Ignore type error when type checking with Deno versions
    await Deno.serve(opts, (r, { remoteAddr })=>handler(r, {
        remoteAddr,
        localAddr: {
          transport: "tcp",
          hostname: opts.hostname ?? "localhost",
          port: opts.port
        }
      })).finished;
  } else {
    // @ts-ignore Deprecated std serve way
    await serve(handler, opts);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9ib290LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERFTk9fREVQTE9ZTUVOVF9JRCB9IGZyb20gXCIuL2J1aWxkX2lkLnRzXCI7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBTZXJ2ZUhhbmRsZXIgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRTZXJ2ZXIoXG4gIGhhbmRsZXI6IERlbm8uU2VydmVIYW5kbGVyLFxuICBvcHRzOiBQYXJ0aWFsPERlbm8uU2VydmVUbHNPcHRpb25zPiAmIHsgYmFzZVBhdGg6IHN0cmluZyB9LFxuKSB7XG4gIGlmICghb3B0cy5vbkxpc3Rlbikge1xuICAgIG9wdHMub25MaXN0ZW4gPSAocGFyYW1zKSA9PiB7XG4gICAgICBjb25zdCBwYXRobmFtZSA9IG9wdHMuYmFzZVBhdGggKyBcIi9cIjtcbiAgICAgIGNvbnN0IGh0dHBzID0gISEob3B0cy5rZXkgJiYgb3B0cy5jZXJ0KTtcbiAgICAgIGNvbnN0IHByb3RvY29sID0gaHR0cHMgPyBcImh0dHBzOlwiIDogXCJodHRwOlwiO1xuICAgICAgY29uc3QgYWRkcmVzcyA9IGNvbG9ycy5jeWFuKFxuICAgICAgICBgJHtwcm90b2NvbH0vL2xvY2FsaG9zdDoke3BhcmFtcy5wb3J0fSR7cGF0aG5hbWV9YCxcbiAgICAgICk7XG4gICAgICBjb25zdCBsb2NhbExhYmVsID0gY29sb3JzLmJvbGQoXCJMb2NhbDpcIik7XG5cbiAgICAgIC8vIFByaW50IG1vcmUgY29uY2lzZSBvdXRwdXQgZm9yIGRlcGxveSBsb2dzXG4gICAgICBpZiAoREVOT19ERVBMT1lNRU5UX0lEKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGNvbG9ycy5iZ1JnYjgoY29sb3JzLnJnYjgoXCIg8J+NiyBGcmVzaCByZWFkeSBcIiwgMCksIDEyMSksXG4gICAgICAgICAgYCR7bG9jYWxMYWJlbH0gJHthZGRyZXNzfWAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygpO1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBjb2xvcnMuYmdSZ2I4KGNvbG9ycy5yZ2I4KFwiIPCfjYsgRnJlc2ggcmVhZHkgXCIsIDApLCAxMjEpLFxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7bG9jYWxMYWJlbH0gJHthZGRyZXNzfVxcbmApO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBjb25zdCBwb3J0RW52ID0gRGVuby5lbnYuZ2V0KFwiUE9SVFwiKTtcbiAgaWYgKHBvcnRFbnYgIT09IHVuZGVmaW5lZCkge1xuICAgIG9wdHMucG9ydCA/Pz0gcGFyc2VJbnQocG9ydEVudiwgMTApO1xuICB9XG5cbiAgaWYgKG9wdHMucG9ydCkge1xuICAgIGF3YWl0IGJvb3RTZXJ2ZXIoaGFuZGxlciwgb3B0cyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTm8gcG9ydCBzcGVjaWZpZWQsIGNoZWNrIGZvciBhIGZyZWUgcG9ydC4gSW5zdGVhZCBvZiBwaWNraW5nIGp1c3RcbiAgICAvLyBhbnkgcG9ydCB3ZSdsbCBjaGVjayBpZiB0aGUgbmV4dCBvbmUgaXMgZnJlZSBmb3IgVVggcmVhc29ucy5cbiAgICAvLyBUaGF0IHdheSB0aGUgdXNlciBvbmx5IG5lZWRzIHRvIGluY3JlbWVudCBhIG51bWJlciB3aGVuIHJ1bm5pbmdcbiAgICAvLyBtdWx0aXBsZSBhcHBzIHZzIGhhdmluZyB0byByZW1lbWJlciBjb21wbGV0ZWx5IGRpZmZlcmVudCBwb3J0cy5cbiAgICBsZXQgZmlyc3RFcnJvcjtcbiAgICBmb3IgKGxldCBwb3J0ID0gODAwMDsgcG9ydCA8IDgwMjA7IHBvcnQrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYm9vdFNlcnZlcihoYW5kbGVyLCB7IC4uLm9wdHMsIHBvcnQgfSk7XG4gICAgICAgIGZpcnN0RXJyb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BZGRySW5Vc2UpIHtcbiAgICAgICAgICAvLyBUaHJvdyBmaXJzdCBFQUREUklOVVNFIGVycm9yXG4gICAgICAgICAgLy8gaWYgbm8gcG9ydCBpcyBmcmVlXG4gICAgICAgICAgaWYgKCFmaXJzdEVycm9yKSB7XG4gICAgICAgICAgICBmaXJzdEVycm9yID0gZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmlyc3RFcnJvcikge1xuICAgICAgdGhyb3cgZmlyc3RFcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYm9vdFNlcnZlcihcbiAgaGFuZGxlcjogU2VydmVIYW5kbGVyLFxuICBvcHRzOiBQYXJ0aWFsPERlbm8uU2VydmVUbHNPcHRpb25zPixcbikge1xuICAvLyBAdHMtaWdub3JlIElnbm9yZSB0eXBlIGVycm9yIHdoZW4gdHlwZSBjaGVja2luZyB3aXRoIERlbm8gdmVyc2lvbnNcbiAgaWYgKHR5cGVvZiBEZW5vLnNlcnZlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBAdHMtaWdub3JlIElnbm9yZSB0eXBlIGVycm9yIHdoZW4gdHlwZSBjaGVja2luZyB3aXRoIERlbm8gdmVyc2lvbnNcbiAgICBhd2FpdCBEZW5vLnNlcnZlKFxuICAgICAgb3B0cyxcbiAgICAgIChyLCB7IHJlbW90ZUFkZHIgfSkgPT5cbiAgICAgICAgaGFuZGxlcihyLCB7XG4gICAgICAgICAgcmVtb3RlQWRkcixcbiAgICAgICAgICBsb2NhbEFkZHI6IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydDogXCJ0Y3BcIixcbiAgICAgICAgICAgIGhvc3RuYW1lOiBvcHRzLmhvc3RuYW1lID8/IFwibG9jYWxob3N0XCIsXG4gICAgICAgICAgICBwb3J0OiBvcHRzLnBvcnQsXG4gICAgICAgICAgfSBhcyBEZW5vLk5ldEFkZHIsXG4gICAgICAgIH0pLFxuICAgICkuZmluaXNoZWQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gQHRzLWlnbm9yZSBEZXByZWNhdGVkIHN0ZCBzZXJ2ZSB3YXlcbiAgICBhd2FpdCBzZXJ2ZShoYW5kbGVyLCBvcHRzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsa0JBQWtCLFFBQVEsZ0JBQWdCO0FBQ25ELFNBQVMsTUFBTSxRQUFRLFlBQVk7QUFHbkMsT0FBTyxlQUFlLFlBQ3BCLE9BQTBCLEVBQzFCLElBQTBEO0VBRTFELElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtJQUNsQixLQUFLLFFBQVEsR0FBRyxDQUFDO01BQ2YsTUFBTSxXQUFXLEtBQUssUUFBUSxHQUFHO01BQ2pDLE1BQU0sUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLElBQUk7TUFDdEMsTUFBTSxXQUFXLFFBQVEsV0FBVztNQUNwQyxNQUFNLFVBQVUsT0FBTyxJQUFJLENBQ3pCLEdBQUcsU0FBUyxZQUFZLEVBQUUsT0FBTyxJQUFJLEdBQUcsVUFBVTtNQUVwRCxNQUFNLGFBQWEsT0FBTyxJQUFJLENBQUM7TUFFL0IsNENBQTRDO01BQzVDLElBQUksb0JBQW9CO1FBQ3RCLFFBQVEsR0FBRyxDQUNULE9BQU8sTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixJQUFJLE1BQ2xELEdBQUcsV0FBVyxDQUFDLEVBQUUsU0FBUztNQUU5QixPQUFPO1FBQ0wsUUFBUSxHQUFHO1FBQ1gsUUFBUSxHQUFHLENBQ1QsT0FBTyxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLElBQUk7UUFFcEQsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7TUFDOUM7SUFDRjtFQUNGO0VBRUEsTUFBTSxVQUFVLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUM3QixJQUFJLFlBQVksV0FBVztJQUN6QixLQUFLLElBQUksS0FBSyxTQUFTLFNBQVM7RUFDbEM7RUFFQSxJQUFJLEtBQUssSUFBSSxFQUFFO0lBQ2IsTUFBTSxXQUFXLFNBQVM7RUFDNUIsT0FBTztJQUNMLG9FQUFvRTtJQUNwRSwrREFBK0Q7SUFDL0Qsa0VBQWtFO0lBQ2xFLGtFQUFrRTtJQUNsRSxJQUFJO0lBQ0osSUFBSyxJQUFJLE9BQU8sTUFBTSxPQUFPLE1BQU0sT0FBUTtNQUN6QyxJQUFJO1FBQ0YsTUFBTSxXQUFXLFNBQVM7VUFBRSxHQUFHLElBQUk7VUFBRTtRQUFLO1FBQzFDLGFBQWE7UUFDYjtNQUNGLEVBQUUsT0FBTyxLQUFLO1FBQ1osSUFBSSxlQUFlLEtBQUssTUFBTSxDQUFDLFNBQVMsRUFBRTtVQUN4QywrQkFBK0I7VUFDL0IscUJBQXFCO1VBQ3JCLElBQUksQ0FBQyxZQUFZO1lBQ2YsYUFBYTtVQUNmO1VBQ0E7UUFDRjtRQUVBLE1BQU07TUFDUjtJQUNGO0lBRUEsSUFBSSxZQUFZO01BQ2QsTUFBTTtJQUNSO0VBQ0Y7QUFDRjtBQUVBLGVBQWUsV0FDYixPQUFxQixFQUNyQixJQUFtQztFQUVuQyxxRUFBcUU7RUFDckUsSUFBSSxPQUFPLEtBQUssS0FBSyxLQUFLLFlBQVk7SUFDcEMscUVBQXFFO0lBQ3JFLE1BQU0sS0FBSyxLQUFLLENBQ2QsTUFDQSxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUUsR0FDaEIsUUFBUSxHQUFHO1FBQ1Q7UUFDQSxXQUFXO1VBQ1QsV0FBVztVQUNYLFVBQVUsS0FBSyxRQUFRLElBQUk7VUFDM0IsTUFBTSxLQUFLLElBQUk7UUFDakI7TUFDRixJQUNGLFFBQVE7RUFDWixPQUFPO0lBQ0wsc0NBQXNDO0lBQ3RDLE1BQU0sTUFBTSxTQUFTO0VBQ3ZCO0FBQ0YifQ==
// denoCacheMetadata=1256337519644010828,1356491890145672161