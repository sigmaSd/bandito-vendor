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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9ib290LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERFTk9fREVQTE9ZTUVOVF9JRCB9IGZyb20gXCIuL2J1aWxkX2lkLnRzXCI7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBTZXJ2ZUhhbmRsZXIgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRTZXJ2ZXIoXG4gIGhhbmRsZXI6IERlbm8uU2VydmVIYW5kbGVyLFxuICBvcHRzOiBQYXJ0aWFsPERlbm8uU2VydmVUbHNPcHRpb25zPiAmIHsgYmFzZVBhdGg6IHN0cmluZyB9LFxuKSB7XG4gIGlmICghb3B0cy5vbkxpc3Rlbikge1xuICAgIG9wdHMub25MaXN0ZW4gPSAocGFyYW1zKSA9PiB7XG4gICAgICBjb25zdCBwYXRobmFtZSA9IG9wdHMuYmFzZVBhdGggKyBcIi9cIjtcbiAgICAgIGNvbnN0IGh0dHBzID0gISEob3B0cy5rZXkgJiYgb3B0cy5jZXJ0KTtcbiAgICAgIGNvbnN0IHByb3RvY29sID0gaHR0cHMgPyBcImh0dHBzOlwiIDogXCJodHRwOlwiO1xuICAgICAgY29uc3QgYWRkcmVzcyA9IGNvbG9ycy5jeWFuKFxuICAgICAgICBgJHtwcm90b2NvbH0vL2xvY2FsaG9zdDoke3BhcmFtcy5wb3J0fSR7cGF0aG5hbWV9YCxcbiAgICAgICk7XG4gICAgICBjb25zdCBsb2NhbExhYmVsID0gY29sb3JzLmJvbGQoXCJMb2NhbDpcIik7XG5cbiAgICAgIC8vIFByaW50IG1vcmUgY29uY2lzZSBvdXRwdXQgZm9yIGRlcGxveSBsb2dzXG4gICAgICBpZiAoREVOT19ERVBMT1lNRU5UX0lEKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGNvbG9ycy5iZ1JnYjgoY29sb3JzLnJnYjgoXCIg8J+NiyBGcmVzaCByZWFkeSBcIiwgMCksIDEyMSksXG4gICAgICAgICAgYCR7bG9jYWxMYWJlbH0gJHthZGRyZXNzfWAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygpO1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBjb2xvcnMuYmdSZ2I4KGNvbG9ycy5yZ2I4KFwiIPCfjYsgRnJlc2ggcmVhZHkgXCIsIDApLCAxMjEpLFxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7bG9jYWxMYWJlbH0gJHthZGRyZXNzfVxcbmApO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBjb25zdCBwb3J0RW52ID0gRGVuby5lbnYuZ2V0KFwiUE9SVFwiKTtcbiAgaWYgKHBvcnRFbnYgIT09IHVuZGVmaW5lZCkge1xuICAgIG9wdHMucG9ydCA/Pz0gcGFyc2VJbnQocG9ydEVudiwgMTApO1xuICB9XG5cbiAgaWYgKG9wdHMucG9ydCkge1xuICAgIGF3YWl0IGJvb3RTZXJ2ZXIoaGFuZGxlciwgb3B0cyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTm8gcG9ydCBzcGVjaWZpZWQsIGNoZWNrIGZvciBhIGZyZWUgcG9ydC4gSW5zdGVhZCBvZiBwaWNraW5nIGp1c3RcbiAgICAvLyBhbnkgcG9ydCB3ZSdsbCBjaGVjayBpZiB0aGUgbmV4dCBvbmUgaXMgZnJlZSBmb3IgVVggcmVhc29ucy5cbiAgICAvLyBUaGF0IHdheSB0aGUgdXNlciBvbmx5IG5lZWRzIHRvIGluY3JlbWVudCBhIG51bWJlciB3aGVuIHJ1bm5pbmdcbiAgICAvLyBtdWx0aXBsZSBhcHBzIHZzIGhhdmluZyB0byByZW1lbWJlciBjb21wbGV0ZWx5IGRpZmZlcmVudCBwb3J0cy5cbiAgICBsZXQgZmlyc3RFcnJvcjtcbiAgICBmb3IgKGxldCBwb3J0ID0gODAwMDsgcG9ydCA8IDgwMjA7IHBvcnQrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYm9vdFNlcnZlcihoYW5kbGVyLCB7IC4uLm9wdHMsIHBvcnQgfSk7XG4gICAgICAgIGZpcnN0RXJyb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BZGRySW5Vc2UpIHtcbiAgICAgICAgICAvLyBUaHJvdyBmaXJzdCBFQUREUklOVVNFIGVycm9yXG4gICAgICAgICAgLy8gaWYgbm8gcG9ydCBpcyBmcmVlXG4gICAgICAgICAgaWYgKCFmaXJzdEVycm9yKSB7XG4gICAgICAgICAgICBmaXJzdEVycm9yID0gZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmlyc3RFcnJvcikge1xuICAgICAgdGhyb3cgZmlyc3RFcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYm9vdFNlcnZlcihcbiAgaGFuZGxlcjogU2VydmVIYW5kbGVyLFxuICBvcHRzOiBQYXJ0aWFsPERlbm8uU2VydmVUbHNPcHRpb25zPixcbikge1xuICAvLyBAdHMtaWdub3JlIElnbm9yZSB0eXBlIGVycm9yIHdoZW4gdHlwZSBjaGVja2luZyB3aXRoIERlbm8gdmVyc2lvbnNcbiAgaWYgKHR5cGVvZiBEZW5vLnNlcnZlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBAdHMtaWdub3JlIElnbm9yZSB0eXBlIGVycm9yIHdoZW4gdHlwZSBjaGVja2luZyB3aXRoIERlbm8gdmVyc2lvbnNcbiAgICBhd2FpdCBEZW5vLnNlcnZlKFxuICAgICAgb3B0cyxcbiAgICAgIChyLCB7IHJlbW90ZUFkZHIgfSkgPT5cbiAgICAgICAgaGFuZGxlcihyLCB7XG4gICAgICAgICAgcmVtb3RlQWRkcixcbiAgICAgICAgICBsb2NhbEFkZHI6IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydDogXCJ0Y3BcIixcbiAgICAgICAgICAgIGhvc3RuYW1lOiBvcHRzLmhvc3RuYW1lID8/IFwibG9jYWxob3N0XCIsXG4gICAgICAgICAgICBwb3J0OiBvcHRzLnBvcnQsXG4gICAgICAgICAgfSBhcyBEZW5vLk5ldEFkZHIsXG4gICAgICAgIH0pLFxuICAgICkuZmluaXNoZWQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gQHRzLWlnbm9yZSBEZXByZWNhdGVkIHN0ZCBzZXJ2ZSB3YXlcbiAgICBhd2FpdCBzZXJ2ZShoYW5kbGVyLCBvcHRzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsa0JBQWtCLFFBQVEsZ0JBQWdCO0FBQ25ELFNBQVMsTUFBTSxRQUFRLFlBQVk7QUFHbkMsT0FBTyxlQUFlLFlBQ3BCLE9BQTBCLEVBQzFCLElBQTBEO0VBRTFELElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtJQUNsQixLQUFLLFFBQVEsR0FBRyxDQUFDO01BQ2YsTUFBTSxXQUFXLEtBQUssUUFBUSxHQUFHO01BQ2pDLE1BQU0sUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLElBQUk7TUFDdEMsTUFBTSxXQUFXLFFBQVEsV0FBVztNQUNwQyxNQUFNLFVBQVUsT0FBTyxJQUFJLENBQ3pCLENBQUMsRUFBRSxTQUFTLFlBQVksRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQztNQUVwRCxNQUFNLGFBQWEsT0FBTyxJQUFJLENBQUM7TUFFL0IsNENBQTRDO01BQzVDLElBQUksb0JBQW9CO1FBQ3RCLFFBQVEsR0FBRyxDQUNULE9BQU8sTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixJQUFJLE1BQ2xELENBQUMsRUFBRSxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUM7TUFFOUIsT0FBTztRQUNMLFFBQVEsR0FBRztRQUNYLFFBQVEsR0FBRyxDQUNULE9BQU8sTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixJQUFJO1FBRXBELFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO01BQzlDO0lBQ0Y7RUFDRjtFQUVBLE1BQU0sVUFBVSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFDN0IsSUFBSSxZQUFZLFdBQVc7SUFDekIsS0FBSyxJQUFJLEtBQUssU0FBUyxTQUFTO0VBQ2xDO0VBRUEsSUFBSSxLQUFLLElBQUksRUFBRTtJQUNiLE1BQU0sV0FBVyxTQUFTO0VBQzVCLE9BQU87SUFDTCxvRUFBb0U7SUFDcEUsK0RBQStEO0lBQy9ELGtFQUFrRTtJQUNsRSxrRUFBa0U7SUFDbEUsSUFBSTtJQUNKLElBQUssSUFBSSxPQUFPLE1BQU0sT0FBTyxNQUFNLE9BQVE7TUFDekMsSUFBSTtRQUNGLE1BQU0sV0FBVyxTQUFTO1VBQUUsR0FBRyxJQUFJO1VBQUU7UUFBSztRQUMxQyxhQUFhO1FBQ2I7TUFDRixFQUFFLE9BQU8sS0FBSztRQUNaLElBQUksZUFBZSxLQUFLLE1BQU0sQ0FBQyxTQUFTLEVBQUU7VUFDeEMsK0JBQStCO1VBQy9CLHFCQUFxQjtVQUNyQixJQUFJLENBQUMsWUFBWTtZQUNmLGFBQWE7VUFDZjtVQUNBO1FBQ0Y7UUFFQSxNQUFNO01BQ1I7SUFDRjtJQUVBLElBQUksWUFBWTtNQUNkLE1BQU07SUFDUjtFQUNGO0FBQ0Y7QUFFQSxlQUFlLFdBQ2IsT0FBcUIsRUFDckIsSUFBbUM7RUFFbkMscUVBQXFFO0VBQ3JFLElBQUksT0FBTyxLQUFLLEtBQUssS0FBSyxZQUFZO0lBQ3BDLHFFQUFxRTtJQUNyRSxNQUFNLEtBQUssS0FBSyxDQUNkLE1BQ0EsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQ2hCLFFBQVEsR0FBRztRQUNUO1FBQ0EsV0FBVztVQUNULFdBQVc7VUFDWCxVQUFVLEtBQUssUUFBUSxJQUFJO1VBQzNCLE1BQU0sS0FBSyxJQUFJO1FBQ2pCO01BQ0YsSUFDRixRQUFRO0VBQ1osT0FBTztJQUNMLHNDQUFzQztJQUN0QyxNQUFNLE1BQU0sU0FBUztFQUN2QjtBQUNGIn0=
// denoCacheMetadata=9855586625563533303,6022946830512871920