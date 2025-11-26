import { TextDelimiterStream } from "https://deno.land/std@0.141.0/streams/delimiter.ts";
const bandWhichExe = Deno.env.get("BANDWHICH") || "bandwhich";
export async function* bandwhich(interfaceName) {
  const bandwhichStream = new Deno.Command("pkexec", {
    args: [
      bandWhichExe,
      "-p",
      "--raw",
      "-i",
      interfaceName
    ],
    stdout: "piped"
  }).spawn().stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new TextDelimiterStream("\n\n"));
  for await (const data of bandwhichStream){
    yield parse(data);
  }
}
function parse(data) {
  return data.split("\n").slice(1).map((line)=>{
    if (line === "<NO TRAFFIC>") {
      return;
    }
    const lineParts = line.split(/\s+/);
    const name = lineParts[2].slice(1, -1);
    const netRate = lineParts[5];
    const uploadRate = parseFloat(netRate.split("/")[0]);
    const downloadRate = parseFloat(netRate.split("/")[1]);
    return {
      name,
      downloadRate,
      uploadRate
    };
  }).filter((e)=>e);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9tcmNvb2wvZGV2L2Rlbm8vYmFuZGl0by9uZXRtb25pdG9yL2JhbmR3aGljaC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RGVsaW1pdGVyU3RyZWFtIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE0MS4wL3N0cmVhbXMvZGVsaW1pdGVyLnRzXCI7XG5cbmNvbnN0IGJhbmRXaGljaEV4ZSA9IERlbm8uZW52LmdldChcIkJBTkRXSElDSFwiKSB8fCBcImJhbmR3aGljaFwiO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBiYW5kd2hpY2goaW50ZXJmYWNlTmFtZTogc3RyaW5nKSB7XG4gIGNvbnN0IGJhbmR3aGljaFN0cmVhbSA9IG5ldyBEZW5vLkNvbW1hbmQoXCJwa2V4ZWNcIiwge1xuICAgIGFyZ3M6IFtiYW5kV2hpY2hFeGUsIFwiLXBcIiwgXCItLXJhd1wiLCBcIi1pXCIsIGludGVyZmFjZU5hbWVdLFxuICAgIHN0ZG91dDogXCJwaXBlZFwiLFxuICB9KS5zcGF3bigpXG4gICAgLnN0ZG91dFxuICAgIC5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0oKSlcbiAgICAucGlwZVRocm91Z2goXG4gICAgICBuZXcgVGV4dERlbGltaXRlclN0cmVhbShcIlxcblxcblwiKSxcbiAgICApO1xuXG4gIGZvciBhd2FpdCAoY29uc3QgZGF0YSBvZiBiYW5kd2hpY2hTdHJlYW0pIHtcbiAgICB5aWVsZCBwYXJzZShkYXRhKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZShkYXRhOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGRhdGEuc3BsaXQoXCJcXG5cIikuc2xpY2UoMSkubWFwKChsaW5lKSA9PiB7XG4gICAgaWYgKGxpbmUgPT09IFwiPE5PIFRSQUZGSUM+XCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGluZVBhcnRzID0gbGluZS5zcGxpdCgvXFxzKy8pO1xuXG4gICAgY29uc3QgbmFtZSA9IGxpbmVQYXJ0c1syXS5zbGljZSgxLCAtMSk7XG4gICAgY29uc3QgbmV0UmF0ZSA9IGxpbmVQYXJ0c1s1XTtcblxuICAgIGNvbnN0IHVwbG9hZFJhdGUgPSBwYXJzZUZsb2F0KG5ldFJhdGUuc3BsaXQoXCIvXCIpWzBdKTtcbiAgICBjb25zdCBkb3dubG9hZFJhdGUgPSBwYXJzZUZsb2F0KG5ldFJhdGUuc3BsaXQoXCIvXCIpWzFdKTtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZSxcbiAgICAgIGRvd25sb2FkUmF0ZSxcbiAgICAgIHVwbG9hZFJhdGUsXG4gICAgfTtcbiAgfSkuZmlsdGVyKChlKSA9PiBlKSBhcyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvd25sb2FkUmF0ZTogbnVtYmVyO1xuICAgIHVwbG9hZFJhdGU6IG51bWJlcjtcbiAgfVtdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsbUJBQW1CLFFBQVEscURBQXFEO0FBRXpGLE1BQU0sZUFBZSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCO0FBQ2xELE9BQU8sZ0JBQWdCLFVBQVUsYUFBcUI7RUFDcEQsTUFBTSxrQkFBa0IsSUFBSSxLQUFLLE9BQU8sQ0FBQyxVQUFVO0lBQ2pELE1BQU07TUFBQztNQUFjO01BQU07TUFBUztNQUFNO0tBQWM7SUFDeEQsUUFBUTtFQUNWLEdBQUcsS0FBSyxHQUNMLE1BQU0sQ0FDTixXQUFXLENBQUMsSUFBSSxxQkFDaEIsV0FBVyxDQUNWLElBQUksb0JBQW9CO0VBRzVCLFdBQVcsTUFBTSxRQUFRLGdCQUFpQjtJQUN4QyxNQUFNLE1BQU07RUFDZDtBQUNGO0FBRUEsU0FBUyxNQUFNLElBQVk7RUFDekIsT0FBTyxLQUFLLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLElBQUksU0FBUyxnQkFBZ0I7TUFDM0I7SUFDRjtJQUNBLE1BQU0sWUFBWSxLQUFLLEtBQUssQ0FBQztJQUU3QixNQUFNLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ3BDLE1BQU0sVUFBVSxTQUFTLENBQUMsRUFBRTtJQUU1QixNQUFNLGFBQWEsV0FBVyxRQUFRLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNuRCxNQUFNLGVBQWUsV0FBVyxRQUFRLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNyRCxPQUFPO01BQ0w7TUFDQTtNQUNBO0lBQ0Y7RUFDRixHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQU07QUFLbkIifQ==
// denoCacheMetadata=14925148428858923210,17441054591861406701