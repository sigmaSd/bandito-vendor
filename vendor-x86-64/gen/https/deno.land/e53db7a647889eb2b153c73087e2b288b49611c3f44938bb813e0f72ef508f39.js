import { virtualSheet } from "twind/sheets";
import { setup, STYLE_ELEMENT_ID } from "./twind/shared.ts";
export default function twind(options) {
  const sheet = virtualSheet();
  setup(options, sheet);
  const main = `data:application/javascript,import hydrate from "${new URL("./twind/main.ts", import.meta.url).href}";
import options from "${options.selfURL}";
export default function(state) { hydrate(options, state); }`;
  return {
    name: "twind",
    entrypoints: {
      "main": main
    },
    async renderAsync (ctx) {
      sheet.reset(undefined);
      await ctx.renderAsync();
      const cssTexts = [
        ...sheet.target
      ];
      const snapshot = sheet.reset();
      const precedences = snapshot[1];
      const cssText = cssTexts.map((cssText, i)=>`${cssText}/*${precedences[i].toString(36)}*/`).join("\n");
      const mappings = [];
      for (const [key, value] of snapshot[3].entries()){
        if (key === value) {
          mappings.push(key);
        } else {
          mappings.push([
            key,
            value
          ]);
        }
      }
      return {
        scripts: [
          {
            entrypoint: "main",
            state: mappings
          }
        ],
        styles: [
          {
            cssText,
            id: STYLE_ELEMENT_ID
          }
        ]
      };
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42LjgvcGx1Z2lucy90d2luZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB2aXJ0dWFsU2hlZXQgfSBmcm9tIFwidHdpbmQvc2hlZXRzXCI7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwiLi4vc2VydmVyLnRzXCI7XG5cbmltcG9ydCB7IE9wdGlvbnMsIHNldHVwLCBTVFlMRV9FTEVNRU5UX0lEIH0gZnJvbSBcIi4vdHdpbmQvc2hhcmVkLnRzXCI7XG5leHBvcnQgdHlwZSB7IE9wdGlvbnMgfTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdHdpbmQob3B0aW9uczogT3B0aW9ucyk6IFBsdWdpbiB7XG4gIGNvbnN0IHNoZWV0ID0gdmlydHVhbFNoZWV0KCk7XG4gIHNldHVwKG9wdGlvbnMsIHNoZWV0KTtcbiAgY29uc3QgbWFpbiA9IGBkYXRhOmFwcGxpY2F0aW9uL2phdmFzY3JpcHQsaW1wb3J0IGh5ZHJhdGUgZnJvbSBcIiR7XG4gICAgbmV3IFVSTChcIi4vdHdpbmQvbWFpbi50c1wiLCBpbXBvcnQubWV0YS51cmwpLmhyZWZcbiAgfVwiO1xuaW1wb3J0IG9wdGlvbnMgZnJvbSBcIiR7b3B0aW9ucy5zZWxmVVJMfVwiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc3RhdGUpIHsgaHlkcmF0ZShvcHRpb25zLCBzdGF0ZSk7IH1gO1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwidHdpbmRcIixcbiAgICBlbnRyeXBvaW50czogeyBcIm1haW5cIjogbWFpbiB9LFxuICAgIGFzeW5jIHJlbmRlckFzeW5jKGN0eCkge1xuICAgICAgc2hlZXQucmVzZXQodW5kZWZpbmVkKTtcbiAgICAgIGF3YWl0IGN0eC5yZW5kZXJBc3luYygpO1xuICAgICAgY29uc3QgY3NzVGV4dHMgPSBbLi4uc2hlZXQudGFyZ2V0XTtcbiAgICAgIGNvbnN0IHNuYXBzaG90ID0gc2hlZXQucmVzZXQoKTtcbiAgICAgIGNvbnN0IHByZWNlZGVuY2VzID0gc25hcHNob3RbMV0gYXMgbnVtYmVyW107XG5cbiAgICAgIGNvbnN0IGNzc1RleHQgPSBjc3NUZXh0cy5tYXAoKGNzc1RleHQsIGkpID0+XG4gICAgICAgIGAke2Nzc1RleHR9Lyoke3ByZWNlZGVuY2VzW2ldLnRvU3RyaW5nKDM2KX0qL2BcbiAgICAgICkuam9pbihcIlxcblwiKTtcblxuICAgICAgY29uc3QgbWFwcGluZ3M6IChzdHJpbmcgfCBbc3RyaW5nLCBzdHJpbmddKVtdID0gW107XG4gICAgICBmb3IgKFxuICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gb2YgKHNuYXBzaG90WzNdIGFzIE1hcDxzdHJpbmcsIHN0cmluZz4pLmVudHJpZXMoKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChrZXkgPT09IHZhbHVlKSB7XG4gICAgICAgICAgbWFwcGluZ3MucHVzaChrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hcHBpbmdzLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzY3JpcHRzOiBbeyBlbnRyeXBvaW50OiBcIm1haW5cIiwgc3RhdGU6IG1hcHBpbmdzIH1dLFxuICAgICAgICBzdHlsZXM6IFt7IGNzc1RleHQsIGlkOiBTVFlMRV9FTEVNRU5UX0lEIH1dLFxuICAgICAgfTtcbiAgICB9LFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsWUFBWSxRQUFRLGVBQWU7QUFHNUMsU0FBa0IsS0FBSyxFQUFFLGdCQUFnQixRQUFRLG9CQUFvQjtBQUdyRSxlQUFlLFNBQVMsTUFBTSxPQUFnQjtFQUM1QyxNQUFNLFFBQVE7RUFDZCxNQUFNLFNBQVM7RUFDZixNQUFNLE9BQU8sQ0FBQyxpREFBaUQsRUFDN0QsSUFBSSxJQUFJLG1CQUFtQixZQUFZLEdBQUcsRUFBRSxJQUFJLENBQ2pEO3FCQUNrQixFQUFFLFFBQVEsT0FBTyxDQUFDOzJEQUNvQixDQUFDO0VBQzFELE9BQU87SUFDTCxNQUFNO0lBQ04sYUFBYTtNQUFFLFFBQVE7SUFBSztJQUM1QixNQUFNLGFBQVksR0FBRztNQUNuQixNQUFNLEtBQUssQ0FBQztNQUNaLE1BQU0sSUFBSSxXQUFXO01BQ3JCLE1BQU0sV0FBVztXQUFJLE1BQU0sTUFBTTtPQUFDO01BQ2xDLE1BQU0sV0FBVyxNQUFNLEtBQUs7TUFDNUIsTUFBTSxjQUFjLFFBQVEsQ0FBQyxFQUFFO01BRS9CLE1BQU0sVUFBVSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsSUFDckMsR0FBRyxRQUFRLEVBQUUsRUFBRSxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUM5QyxJQUFJLENBQUM7TUFFUCxNQUFNLFdBQTBDLEVBQUU7TUFDbEQsS0FDRSxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksQUFBQyxRQUFRLENBQUMsRUFBRSxDQUF5QixPQUFPLEdBQ2xFO1FBQ0EsSUFBSSxRQUFRLE9BQU87VUFDakIsU0FBUyxJQUFJLENBQUM7UUFDaEIsT0FBTztVQUNMLFNBQVMsSUFBSSxDQUFDO1lBQUM7WUFBSztXQUFNO1FBQzVCO01BQ0Y7TUFFQSxPQUFPO1FBQ0wsU0FBUztVQUFDO1lBQUUsWUFBWTtZQUFRLE9BQU87VUFBUztTQUFFO1FBQ2xELFFBQVE7VUFBQztZQUFFO1lBQVMsSUFBSTtVQUFpQjtTQUFFO01BQzdDO0lBQ0Y7RUFDRjtBQUNGIn0=
// denoCacheMetadata=422779464962042139,17368342980228966381