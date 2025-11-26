import { ElTrafico } from "../../eltrafico/eltrafico.ts";
// start eltrafico when the server starts
const eltrafico = new ElTrafico();
export const userInterface = Deno.args[0];
if (!userInterface) {
  console.error("Please specify an interface, example `bandit wlan0`");
  Deno.exit(1);
}
await eltrafico.interface(userInterface);
const polledApps = [];
let pollEnded = false;
const pollForEver = async ()=>{
  while(true){
    const data = await eltrafico.poll();
    if (data.stop) {
      pollEnded = true;
      break;
    } else {
      for (const app of data.programs ?? []){
        if (!polledApps.includes(app)) {
          polledApps.push(app);
        }
      }
    }
  }
};
pollForEver();
export const handler = {
  async POST (req) {
    const message = await req.json();
    switch(message.method){
      case "ping":
        return new Response("pong");
      case "interface":
        await eltrafico.interface(message.interface);
        break;
      case "limit":
        await eltrafico.limit(message.app);
        break;
      case "poll":
        if (pollEnded) {
          return new Response(JSON.stringify({
            stop: true
          }));
        }
        return new Response(JSON.stringify(polledApps));
      case "stop":
        await eltrafico.stop();
        break;
      default:
        console.error("Unkown method: ", message.method);
    }
    return new Response();
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9tcmNvb2wvZGV2L2Rlbm8vYmFuZGl0by9yb3V0ZXMvYXBpL2VsdHJhZmljby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIYW5kbGVycyB9IGZyb20gXCIkZnJlc2gvc2VydmVyLnRzXCI7XG5pbXBvcnQgeyBFbFRyYWZpY28gfSBmcm9tIFwiLi4vLi4vZWx0cmFmaWNvL2VsdHJhZmljby50c1wiO1xuXG4vLyBzdGFydCBlbHRyYWZpY28gd2hlbiB0aGUgc2VydmVyIHN0YXJ0c1xuY29uc3QgZWx0cmFmaWNvID0gbmV3IEVsVHJhZmljbygpO1xuZXhwb3J0IGNvbnN0IHVzZXJJbnRlcmZhY2UgPSBEZW5vLmFyZ3NbMF07XG5pZiAoIXVzZXJJbnRlcmZhY2UpIHtcbiAgY29uc29sZS5lcnJvcihcIlBsZWFzZSBzcGVjaWZ5IGFuIGludGVyZmFjZSwgZXhhbXBsZSBgYmFuZGl0IHdsYW4wYFwiKTtcbiAgRGVuby5leGl0KDEpO1xufVxuYXdhaXQgZWx0cmFmaWNvLmludGVyZmFjZSh1c2VySW50ZXJmYWNlKTtcblxuY29uc3QgcG9sbGVkQXBwczogeyBuYW1lOiBzdHJpbmcgfVtdID0gW107XG5sZXQgcG9sbEVuZGVkID0gZmFsc2U7XG5jb25zdCBwb2xsRm9yRXZlciA9IGFzeW5jICgpID0+IHtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZWx0cmFmaWNvLnBvbGwoKTtcbiAgICBpZiAoZGF0YS5zdG9wKSB7XG4gICAgICBwb2xsRW5kZWQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3QgYXBwIG9mIGRhdGEucHJvZ3JhbXMgPz8gW10pIHtcbiAgICAgICAgaWYgKCFwb2xsZWRBcHBzLmluY2x1ZGVzKGFwcCkpIHtcbiAgICAgICAgICBwb2xsZWRBcHBzLnB1c2goYXBwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbnBvbGxGb3JFdmVyKCk7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyOiBIYW5kbGVycyA9IHtcbiAgYXN5bmMgUE9TVChyZXEpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgcmVxLmpzb24oKTtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UubWV0aG9kKSB7XG4gICAgICBjYXNlIFwicGluZ1wiOlxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFwicG9uZ1wiKTtcbiAgICAgIGNhc2UgXCJpbnRlcmZhY2VcIjpcbiAgICAgICAgYXdhaXQgZWx0cmFmaWNvLmludGVyZmFjZShtZXNzYWdlLmludGVyZmFjZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxpbWl0XCI6XG4gICAgICAgIGF3YWl0IGVsdHJhZmljby5saW1pdChtZXNzYWdlLmFwcCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInBvbGxcIjpcbiAgICAgICAgaWYgKHBvbGxFbmRlZCkge1xuICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdG9wOiB0cnVlIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHBvbGxlZEFwcHMpKTtcbiAgICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIGF3YWl0IGVsdHJhZmljby5zdG9wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlVua293biBtZXRob2Q6IFwiLCBtZXNzYWdlLm1ldGhvZCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoKTtcbiAgfSxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxTQUFTLFFBQVEsK0JBQStCO0FBRXpELHlDQUF5QztBQUN6QyxNQUFNLFlBQVksSUFBSTtBQUN0QixPQUFPLE1BQU0sZ0JBQWdCLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUMxQyxJQUFJLENBQUMsZUFBZTtFQUNsQixRQUFRLEtBQUssQ0FBQztFQUNkLEtBQUssSUFBSSxDQUFDO0FBQ1o7QUFDQSxNQUFNLFVBQVUsU0FBUyxDQUFDO0FBRTFCLE1BQU0sYUFBaUMsRUFBRTtBQUN6QyxJQUFJLFlBQVk7QUFDaEIsTUFBTSxjQUFjO0VBQ2xCLE1BQU8sS0FBTTtJQUNYLE1BQU0sT0FBTyxNQUFNLFVBQVUsSUFBSTtJQUNqQyxJQUFJLEtBQUssSUFBSSxFQUFFO01BQ2IsWUFBWTtNQUNaO0lBQ0YsT0FBTztNQUNMLEtBQUssTUFBTSxPQUFPLEtBQUssUUFBUSxJQUFJLEVBQUUsQ0FBRTtRQUNyQyxJQUFJLENBQUMsV0FBVyxRQUFRLENBQUMsTUFBTTtVQUM3QixXQUFXLElBQUksQ0FBQztRQUNsQjtNQUNGO0lBQ0Y7RUFDRjtBQUNGO0FBQ0E7QUFFQSxPQUFPLE1BQU0sVUFBb0I7RUFDL0IsTUFBTSxNQUFLLEdBQUc7SUFDWixNQUFNLFVBQVUsTUFBTSxJQUFJLElBQUk7SUFDOUIsT0FBUSxRQUFRLE1BQU07TUFDcEIsS0FBSztRQUNILE9BQU8sSUFBSSxTQUFTO01BQ3RCLEtBQUs7UUFDSCxNQUFNLFVBQVUsU0FBUyxDQUFDLFFBQVEsU0FBUztRQUMzQztNQUNGLEtBQUs7UUFDSCxNQUFNLFVBQVUsS0FBSyxDQUFDLFFBQVEsR0FBRztRQUNqQztNQUNGLEtBQUs7UUFDSCxJQUFJLFdBQVc7VUFDYixPQUFPLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQztZQUFFLE1BQU07VUFBSztRQUNsRDtRQUNBLE9BQU8sSUFBSSxTQUFTLEtBQUssU0FBUyxDQUFDO01BQ3JDLEtBQUs7UUFDSCxNQUFNLFVBQVUsSUFBSTtRQUNwQjtNQUNGO1FBQ0UsUUFBUSxLQUFLLENBQUMsbUJBQW1CLFFBQVEsTUFBTTtJQUNuRDtJQUNBLE9BQU8sSUFBSTtFQUNiO0FBQ0YsRUFBRSJ9
// denoCacheMetadata=17402449990852685644,9345152963619436497