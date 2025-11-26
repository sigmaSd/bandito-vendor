import { Webview } from "jsr:@webview/webview@0.9.0";
new Worker(new URL("./main.ts", import.meta.url), {
  type: "module"
});
const port = Number.parseInt(Deno.env.get("PORT") || "3425");
const webview = new Webview();
webview.title = "Bandito";
webview.navigate(`http://localhost:${port}`);
// wait for the backend to start
while(true){
  try {
    const resp = await fetch(`http://localhost:${port}/api/eltrafico`, {
      method: "POST",
      body: JSON.stringify({
        method: "ping"
      })
    }).then((res)=>res.text());
    if (resp === "pong") {
      break;
    }
  } catch  {
    await new Promise((resolve)=>setTimeout(resolve, 500));
  }
}
webview.run();
// tell the backend to stop
await fetch(`http://localhost:${port}/api/eltrafico`, {
  method: "POST",
  body: JSON.stringify({
    method: "stop"
  })
});
// wait for the app to stop
while(true){
  const controller = new AbortController();
  const timeoutId = setTimeout(()=>controller.abort(), 1000);
  try {
    await fetch(`http://localhost:${port}/api/eltrafico`, {
      method: "POST",
      body: JSON.stringify({
        method: "poll"
      }),
      signal: controller.signal
    }).then((res)=>res.json());
    clearTimeout(timeoutId);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      break;
    } else {
      throw error;
    }
  }
  await new Promise((resolve)=>setTimeout(resolve, 500));
}
Deno.exit(0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9tcmNvb2wvZGV2L2Rlbm8vYmFuZGl0by93ZWJ2aWV3LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdlYnZpZXcgfSBmcm9tIFwianNyOkB3ZWJ2aWV3L3dlYnZpZXdAMC45LjBcIjtcblxubmV3IFdvcmtlcihuZXcgVVJMKFwiLi9tYWluLnRzXCIsIGltcG9ydC5tZXRhLnVybCksIHtcbiAgdHlwZTogXCJtb2R1bGVcIixcbn0pO1xuXG5jb25zdCBwb3J0ID0gTnVtYmVyLnBhcnNlSW50KERlbm8uZW52LmdldChcIlBPUlRcIikgfHwgXCIzNDI1XCIpO1xuXG5jb25zdCB3ZWJ2aWV3ID0gbmV3IFdlYnZpZXcoKTtcbndlYnZpZXcudGl0bGUgPSBcIkJhbmRpdG9cIjtcbndlYnZpZXcubmF2aWdhdGUoYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWApO1xuXG4vLyB3YWl0IGZvciB0aGUgYmFja2VuZCB0byBzdGFydFxud2hpbGUgKHRydWUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9hcGkvZWx0cmFmaWNvYCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbWV0aG9kOiBcInBpbmdcIixcbiAgICAgIH0pLFxuICAgIH0pLnRoZW4oKHJlcykgPT4gcmVzLnRleHQoKSk7XG4gICAgaWYgKHJlc3AgPT09IFwicG9uZ1wiKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMCkpO1xuICB9XG59XG5cbndlYnZpZXcucnVuKCk7XG5cbi8vIHRlbGwgdGhlIGJhY2tlbmQgdG8gc3RvcFxuYXdhaXQgZmV0Y2goYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9hcGkvZWx0cmFmaWNvYCwge1xuICBtZXRob2Q6IFwiUE9TVFwiLFxuICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgbWV0aG9kOiBcInN0b3BcIixcbiAgfSksXG59KTtcbi8vIHdhaXQgZm9yIHRoZSBhcHAgdG8gc3RvcFxud2hpbGUgKHRydWUpIHtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDEwMDApO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZmV0Y2goYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9hcGkvZWx0cmFmaWNvYCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbWV0aG9kOiBcInBvbGxcIixcbiAgICAgIH0pLFxuICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICAvLyBhcHAgcHJvYmFibHkgc3RvcHBlZFxuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDApKTtcbn1cbkRlbm8uZXhpdCgwKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE9BQU8sUUFBUSw2QkFBNkI7QUFFckQsSUFBSSxPQUFPLElBQUksSUFBSSxhQUFhLFlBQVksR0FBRyxHQUFHO0VBQ2hELE1BQU07QUFDUjtBQUVBLE1BQU0sT0FBTyxPQUFPLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVztBQUVyRCxNQUFNLFVBQVUsSUFBSTtBQUNwQixRQUFRLEtBQUssR0FBRztBQUNoQixRQUFRLFFBQVEsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLE1BQU07QUFFM0MsZ0NBQWdDO0FBQ2hDLE1BQU8sS0FBTTtFQUNYLElBQUk7SUFDRixNQUFNLE9BQU8sTUFBTSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxjQUFjLENBQUMsRUFBRTtNQUNqRSxRQUFRO01BQ1IsTUFBTSxLQUFLLFNBQVMsQ0FBQztRQUNuQixRQUFRO01BQ1Y7SUFDRixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQVEsSUFBSSxJQUFJO0lBQ3pCLElBQUksU0FBUyxRQUFRO01BQ25CO0lBQ0Y7RUFDRixFQUFFLE9BQU07SUFDTixNQUFNLElBQUksUUFBUSxDQUFDLFVBQVksV0FBVyxTQUFTO0VBQ3JEO0FBQ0Y7QUFFQSxRQUFRLEdBQUc7QUFFWCwyQkFBMkI7QUFDM0IsTUFBTSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxjQUFjLENBQUMsRUFBRTtFQUNwRCxRQUFRO0VBQ1IsTUFBTSxLQUFLLFNBQVMsQ0FBQztJQUNuQixRQUFRO0VBQ1Y7QUFDRjtBQUNBLDJCQUEyQjtBQUMzQixNQUFPLEtBQU07RUFDWCxNQUFNLGFBQWEsSUFBSTtFQUN2QixNQUFNLFlBQVksV0FBVyxJQUFNLFdBQVcsS0FBSyxJQUFJO0VBRXZELElBQUk7SUFDRixNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLGNBQWMsQ0FBQyxFQUFFO01BQ3BELFFBQVE7TUFDUixNQUFNLEtBQUssU0FBUyxDQUFDO1FBQ25CLFFBQVE7TUFDVjtNQUNBLFFBQVEsV0FBVyxNQUFNO0lBQzNCLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBUSxJQUFJLElBQUk7SUFDekIsYUFBYTtFQUNmLEVBQUUsT0FBTyxPQUFPO0lBQ2QsSUFBSSxpQkFBaUIsU0FBUyxNQUFNLElBQUksS0FBSyxjQUFjO01BRXpEO0lBQ0YsT0FBTztNQUNMLE1BQU07SUFDUjtFQUNGO0VBQ0EsTUFBTSxJQUFJLFFBQVEsQ0FBQyxVQUFZLFdBQVcsU0FBUztBQUNyRDtBQUNBLEtBQUssSUFBSSxDQUFDIn0=
// denoCacheMetadata=17572956726566915817,307818357411718824