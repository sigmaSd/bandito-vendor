import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { Head } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";
import { format } from "@std/fmt/bytes";
export function Limit({ limit, setLimit }) {
  const [selectedUnit, setSelectedUnit] = useState("kbps");
  const UnitChoice = ()=>{
    return /*#__PURE__*/ _jsxs("select", {
      value: selectedUnit,
      onChange: (e)=>setSelectedUnit(e.target.value),
      class: "ml-1 min-w-fit border-black-400  border rounded-lg bg-white",
      children: [
        /*#__PURE__*/ _jsx("option", {
          value: "bps",
          children: "Bps"
        }),
        /*#__PURE__*/ _jsx("option", {
          value: "kbps",
          children: "Kbps"
        }),
        /*#__PURE__*/ _jsx("option", {
          value: "mbps",
          children: "Mbps"
        })
      ]
    });
  };
  return /*#__PURE__*/ _jsxs("div", {
    class: "flex",
    children: [
      /*#__PURE__*/ _jsx("input", {
        onInput: (event)=>{
          const newValue = Number.parseFloat(event.target.value);
          setLimit({
            value: newValue,
            unit: selectedUnit
          });
        },
        class: "font-mono text-center w-20 font-semibold",
        type: "number",
        value: limit.value
      }),
      /*#__PURE__*/ _jsx(UnitChoice, {})
    ]
  });
}
export function Row({ app }) {
  const [active, setActive] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState({
    value: 450,
    unit: "kbps"
  });
  const [uploadLimit, setUploadLimit] = useState({
    value: 450,
    unit: "kbps"
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(()=>{
    if (active) {
      fetch("/api/eltrafico", {
        method: "POST",
        body: JSON.stringify({
          method: "limit",
          app: {
            global: app.global,
            name: app.name,
            downloadLimit,
            uploadLimit
          }
        })
      });
    } else {
      fetch("/api/eltrafico", {
        method: "POST",
        body: JSON.stringify({
          method: "limit",
          app: {
            global: app.global,
            name: app.name
          }
        })
      });
    }
  }, [
    active,
    downloadLimit,
    uploadLimit
  ]);
  return /*#__PURE__*/ _jsxs("tr", {
    children: [
      /*#__PURE__*/ _jsx("th", {
        children: /*#__PURE__*/ _jsx("i", {
          class: "font-serif font-semibold italic text-blue-600 cursor-pointer",
          style: {
            color: active ? "green" : ""
          },
          children: app.name
        })
      }),
      /*#__PURE__*/ _jsx("th", {
        children: app.downloadRate ? /*#__PURE__*/ _jsx("div", {
          children: format(app.downloadRate, {
            binary: true
          })
        }) : "__"
      }),
      /*#__PURE__*/ _jsx("th", {
        children: app.uploadRate ? /*#__PURE__*/ _jsx("div", {
          children: format(app.uploadRate, {
            binary: true
          })
        }) : "__"
      }),
      /*#__PURE__*/ _jsx("th", {
        children: /*#__PURE__*/ _jsx(Limit, {
          limit: downloadLimit,
          setLimit: setDownloadLimit
        })
      }),
      /*#__PURE__*/ _jsx("th", {
        children: /*#__PURE__*/ _jsx(Limit, {
          limit: uploadLimit,
          setLimit: setUploadLimit
        })
      }),
      /*#__PURE__*/ _jsx("th", {
        children: /*#__PURE__*/ _jsx("input", {
          type: "checkbox",
          checked: active,
          onChange: ()=>{
            setActive(!active);
          },
          class: "m-1"
        })
      })
    ]
  });
}
function Table() {
  const [apps, setApps] = useState([]);
  const [monitor, setMonitor] = useState();
  useEffect(()=>{
    fetch("/api/env?MONITOR").then((r)=>r.text()).then((env)=>{
      if (!env) {
        setMonitor("default");
      } else {
        setMonitor(env);
      }
    });
  }, []);
  useEffect(()=>{
    if (monitor === "default") {
      setInterval(()=>fetch("/api/eltrafico", {
          method: "POST",
          body: JSON.stringify({
            method: "poll"
          })
        }).then((r)=>r.json()).then((msg)=>{
          if (msg.stop) {
            setApps([]);
          } else {
            setApps(msg.programs);
          }
        }), 1000);
    } else if (monitor === "bandwhich") {
      setInterval(()=>fetch("/api/netmonitor").then((r)=>r.json()).then(setApps), 1000);
    }
  }, []);
  //NOTE: this sort is very important due to the dynamic way rows are created
  //FIXME: this doesn't handle all cases
  const global = apps.splice(apps.findIndex((app)=>app.name === "[INTERNAL]GLOBAL"), 1).map((app)=>/*#__PURE__*/ _jsx(Row, {
      app: {
        ...app,
        name: "Global",
        global: true
      }
    }, app.name))[0];
  const body = apps ? apps.sort((a, b)=>a.name.localeCompare(b.name)).map((app)=>/*#__PURE__*/ _jsx(Row, {
      app: app
    }, app.name)) : {};
  return /*#__PURE__*/ _jsx("div", {
    children: /*#__PURE__*/ _jsxs("table", {
      children: [
        /*#__PURE__*/ _jsx("thead", {
          children: /*#__PURE__*/ _jsxs("tr", {
            children: [
              /*#__PURE__*/ _jsx("th", {
                children: "Name"
              }),
              /*#__PURE__*/ _jsx("th", {
                children: "DL Rate"
              }),
              /*#__PURE__*/ _jsx("th", {
                children: "UL Rate"
              }),
              /*#__PURE__*/ _jsx("th", {
                children: "DL Limit"
              }),
              /*#__PURE__*/ _jsx("th", {
                children: "UL Limit"
              }),
              /*#__PURE__*/ _jsx("th", {
                children: "Active"
              })
            ]
          })
        }),
        /*#__PURE__*/ _jsxs("tbody", {
          children: [
            global,
            body
          ]
        })
      ]
    })
  });
}
export default function App() {
  return /*#__PURE__*/ _jsxs("div", {
    children: [
      /*#__PURE__*/ _jsx(Head, {
        children: /*#__PURE__*/ _jsx("link", {
          rel: "stylesheet",
          href: "/table.css"
        })
      }),
      /*#__PURE__*/ _jsx("div", {
        class: "flex",
        children: /*#__PURE__*/ _jsx(Table, {})
      })
    ]
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9tcmNvb2wvZGV2L2Rlbm8vYmFuZGl0by9pc2xhbmRzL0FwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVhZCB9IGZyb20gXCIkZnJlc2gvcnVudGltZS50c1wiO1xuaW1wb3J0IHsgdHlwZSBTdGF0ZVVwZGF0ZXIsIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicHJlYWN0L2hvb2tzXCI7XG5pbXBvcnQgdHlwZSB7IEFwcFByb3BzLCBVbml0IH0gZnJvbSBcIi4uL2ludGVyZmFjZXMvdGFibGUudHNcIjtcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gXCJAc3RkL2ZtdC9ieXRlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gTGltaXQoXG4gIHsgbGltaXQsIHNldExpbWl0IH06IHtcbiAgICBsaW1pdDogeyB2YWx1ZTogbnVtYmVyOyB1bml0OiBVbml0IH07XG4gICAgc2V0TGltaXQ6IFN0YXRlVXBkYXRlcjx7IHZhbHVlOiBudW1iZXI7IHVuaXQ6IFVuaXQgfT47XG4gIH0sXG4pIHtcbiAgY29uc3QgW3NlbGVjdGVkVW5pdCwgc2V0U2VsZWN0ZWRVbml0XSA9IHVzZVN0YXRlPFVuaXQ+KFwia2Jwc1wiKTtcbiAgY29uc3QgVW5pdENob2ljZSA9ICgpID0+IHtcbiAgICByZXR1cm4gKFxuICAgICAgPHNlbGVjdFxuICAgICAgICB2YWx1ZT17c2VsZWN0ZWRVbml0fVxuICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgc2V0U2VsZWN0ZWRVbml0KChlLnRhcmdldCBhcyBIVE1MU2VsZWN0RWxlbWVudCkudmFsdWUgYXMgVW5pdCl9XG4gICAgICAgIGNsYXNzPVwibWwtMSBtaW4tdy1maXQgYm9yZGVyLWJsYWNrLTQwMCAgYm9yZGVyIHJvdW5kZWQtbGcgYmctd2hpdGVcIlxuICAgICAgPlxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYnBzXCI+QnBzPC9vcHRpb24+XG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCJrYnBzXCI+S2Jwczwvb3B0aW9uPlxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwibWJwc1wiPk1icHM8L29wdGlvbj5cbiAgICAgIDwvc2VsZWN0PlxuICAgICk7XG4gIH07XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzcz1cImZsZXhcIj5cbiAgICAgIDxpbnB1dFxuICAgICAgICBvbklucHV0PXsoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IE51bWJlci5wYXJzZUZsb2F0KFxuICAgICAgICAgICAgKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHNldExpbWl0KHtcbiAgICAgICAgICAgIHZhbHVlOiBuZXdWYWx1ZSxcbiAgICAgICAgICAgIHVuaXQ6IHNlbGVjdGVkVW5pdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfX1cbiAgICAgICAgY2xhc3M9XCJmb250LW1vbm8gdGV4dC1jZW50ZXIgdy0yMCBmb250LXNlbWlib2xkXCJcbiAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgIHZhbHVlPXtsaW1pdC52YWx1ZX1cbiAgICAgIC8+XG4gICAgICA8VW5pdENob2ljZSAvPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gUm93KFxuICB7IGFwcCB9OiB7XG4gICAgYXBwOiBBcHBQcm9wcztcbiAgfSxcbikge1xuICBjb25zdCBbYWN0aXZlLCBzZXRBY3RpdmVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZG93bmxvYWRMaW1pdCwgc2V0RG93bmxvYWRMaW1pdF0gPSB1c2VTdGF0ZSh7XG4gICAgdmFsdWU6IDQ1MCxcbiAgICB1bml0OiBcImticHNcIiBhcyBVbml0LFxuICB9KTtcbiAgY29uc3QgW3VwbG9hZExpbWl0LCBzZXRVcGxvYWRMaW1pdF0gPSB1c2VTdGF0ZSh7XG4gICAgdmFsdWU6IDQ1MCxcbiAgICB1bml0OiBcImticHNcIiBhcyBVbml0LFxuICB9KTtcblxuICAvLyBiaW9tZS1pZ25vcmUgbGludC9jb3JyZWN0bmVzcy91c2VFeGhhdXN0aXZlRGVwZW5kZW5jaWVzOiA8ZXhwbGFuYXRpb24+XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGFjdGl2ZSkge1xuICAgICAgZmV0Y2goXCIvYXBpL2VsdHJhZmljb1wiLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBtZXRob2Q6IFwibGltaXRcIixcbiAgICAgICAgICBhcHA6IHtcbiAgICAgICAgICAgIGdsb2JhbDogYXBwLmdsb2JhbCxcbiAgICAgICAgICAgIG5hbWU6IGFwcC5uYW1lLFxuICAgICAgICAgICAgZG93bmxvYWRMaW1pdCxcbiAgICAgICAgICAgIHVwbG9hZExpbWl0LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZldGNoKFwiL2FwaS9lbHRyYWZpY29cIiwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbWV0aG9kOiBcImxpbWl0XCIsXG4gICAgICAgICAgYXBwOiB7XG4gICAgICAgICAgICBnbG9iYWw6IGFwcC5nbG9iYWwsXG4gICAgICAgICAgICBuYW1lOiBhcHAubmFtZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW2FjdGl2ZSwgZG93bmxvYWRMaW1pdCwgdXBsb2FkTGltaXRdKTtcblxuICByZXR1cm4gKFxuICAgIDx0cj5cbiAgICAgIDx0aD5cbiAgICAgICAgPGlcbiAgICAgICAgICBjbGFzcz1cImZvbnQtc2VyaWYgZm9udC1zZW1pYm9sZCBpdGFsaWMgdGV4dC1ibHVlLTYwMCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgc3R5bGU9e3sgY29sb3I6IGFjdGl2ZSA/IFwiZ3JlZW5cIiA6IFwiXCIgfX1cbiAgICAgICAgPlxuICAgICAgICAgIHthcHAubmFtZX1cbiAgICAgICAgPC9pPlxuICAgICAgPC90aD5cbiAgICAgIDx0aD5cbiAgICAgICAge2FwcC5kb3dubG9hZFJhdGVcbiAgICAgICAgICA/IChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIHtmb3JtYXQoYXBwLmRvd25sb2FkUmF0ZSwgeyBiaW5hcnk6IHRydWUgfSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApXG4gICAgICAgICAgOiBcIl9fXCJ9XG4gICAgICA8L3RoPlxuICAgICAgPHRoPlxuICAgICAgICB7YXBwLnVwbG9hZFJhdGVcbiAgICAgICAgICA/IChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIHtmb3JtYXQoYXBwLnVwbG9hZFJhdGUsIHsgYmluYXJ5OiB0cnVlIH0pfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKVxuICAgICAgICAgIDogXCJfX1wifVxuICAgICAgPC90aD5cbiAgICAgIDx0aD5cbiAgICAgICAgPExpbWl0XG4gICAgICAgICAgbGltaXQ9e2Rvd25sb2FkTGltaXR9XG4gICAgICAgICAgc2V0TGltaXQ9e3NldERvd25sb2FkTGltaXR9XG4gICAgICAgIC8+XG4gICAgICA8L3RoPlxuICAgICAgPHRoPlxuICAgICAgICA8TGltaXRcbiAgICAgICAgICBsaW1pdD17dXBsb2FkTGltaXR9XG4gICAgICAgICAgc2V0TGltaXQ9e3NldFVwbG9hZExpbWl0fVxuICAgICAgICAvPlxuICAgICAgPC90aD5cbiAgICAgIDx0aD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICBjaGVja2VkPXthY3RpdmV9XG4gICAgICAgICAgb25DaGFuZ2U9eygpID0+IHtcbiAgICAgICAgICAgIHNldEFjdGl2ZSghYWN0aXZlKTtcbiAgICAgICAgICB9fVxuICAgICAgICAgIGNsYXNzPVwibS0xXCJcbiAgICAgICAgLz5cbiAgICAgIDwvdGg+XG4gICAgPC90cj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gVGFibGUoKSB7XG4gIGNvbnN0IFthcHBzLCBzZXRBcHBzXSA9IHVzZVN0YXRlPEFwcFByb3BzW10+KFtdKTtcbiAgY29uc3QgW21vbml0b3IsIHNldE1vbml0b3JdID0gdXNlU3RhdGU8c3RyaW5nPigpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZmV0Y2goXCIvYXBpL2Vudj9NT05JVE9SXCIpLnRoZW4oKHIpID0+IHIudGV4dCgpKS50aGVuKChlbnYpID0+IHtcbiAgICAgIGlmICghZW52KSB7XG4gICAgICAgIHNldE1vbml0b3IoXCJkZWZhdWx0XCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TW9uaXRvcihlbnYpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAobW9uaXRvciA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgIHNldEludGVydmFsKFxuICAgICAgICAoKSA9PlxuICAgICAgICAgIGZldGNoKFwiL2FwaS9lbHRyYWZpY29cIiwge1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgbWV0aG9kOiBcInBvbGxcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0pLnRoZW4oKHIpID0+IHIuanNvbigpKS50aGVuKChtc2cpID0+IHtcbiAgICAgICAgICAgIGlmIChtc2cuc3RvcCkge1xuICAgICAgICAgICAgICBzZXRBcHBzKFtdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNldEFwcHMobXNnLnByb2dyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgMTAwMCxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChtb25pdG9yID09PSBcImJhbmR3aGljaFwiKSB7XG4gICAgICBzZXRJbnRlcnZhbChcbiAgICAgICAgKCkgPT4gZmV0Y2goXCIvYXBpL25ldG1vbml0b3JcIikudGhlbigocikgPT4gci5qc29uKCkpLnRoZW4oc2V0QXBwcyksXG4gICAgICAgIDEwMDAsXG4gICAgICApO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIC8vTk9URTogdGhpcyBzb3J0IGlzIHZlcnkgaW1wb3J0YW50IGR1ZSB0byB0aGUgZHluYW1pYyB3YXkgcm93cyBhcmUgY3JlYXRlZFxuICAvL0ZJWE1FOiB0aGlzIGRvZXNuJ3QgaGFuZGxlIGFsbCBjYXNlc1xuICBjb25zdCBnbG9iYWwgPSBhcHBzLnNwbGljZShcbiAgICBhcHBzLmZpbmRJbmRleCgoYXBwKSA9PiBhcHAubmFtZSA9PT0gXCJbSU5URVJOQUxdR0xPQkFMXCIpLFxuICAgIDEsXG4gICkubWFwKChhcHApID0+IChcbiAgICA8Um93IGtleT17YXBwLm5hbWV9IGFwcD17eyAuLi5hcHAsIG5hbWU6IFwiR2xvYmFsXCIsIGdsb2JhbDogdHJ1ZSB9fSAvPlxuICApKVswXTtcbiAgY29uc3QgYm9keSA9IGFwcHNcbiAgICA/IGFwcHMuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSkubWFwKChhcHApID0+IChcbiAgICAgIDxSb3cga2V5PXthcHAubmFtZX0gYXBwPXthcHB9IC8+XG4gICAgKSlcbiAgICA6IHt9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDx0YWJsZT5cbiAgICAgICAgPHRoZWFkPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cbiAgICAgICAgICAgIDx0aD5ETCBSYXRlPC90aD5cbiAgICAgICAgICAgIDx0aD5VTCBSYXRlPC90aD5cbiAgICAgICAgICAgIDx0aD5ETCBMaW1pdDwvdGg+XG4gICAgICAgICAgICA8dGg+VUwgTGltaXQ8L3RoPlxuICAgICAgICAgICAgPHRoPkFjdGl2ZTwvdGg+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICAgIHtnbG9iYWx9XG4gICAgICAgICAge2JvZHl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxIZWFkPlxuICAgICAgICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi90YWJsZS5jc3NcIiAvPlxuICAgICAgPC9IZWFkPlxuICAgICAgPGRpdiBjbGFzcz1cImZsZXhcIj5cbiAgICAgICAgPFRhYmxlIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsU0FBUyxJQUFJLFFBQVEsb0JBQW9CO0FBQ3pDLFNBQTRCLFNBQVMsRUFBRSxRQUFRLFFBQVEsZUFBZTtBQUV0RSxTQUFTLE1BQU0sUUFBUSxpQkFBaUI7QUFFeEMsT0FBTyxTQUFTLE1BQ2QsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUdoQjtFQUVELE1BQU0sQ0FBQyxjQUFjLGdCQUFnQixHQUFHLFNBQWU7RUFDdkQsTUFBTSxhQUFhO0lBQ2pCLHFCQUNFLE1BQUM7TUFDQyxPQUFPO01BQ1AsVUFBVSxDQUFDLElBQ1QsZ0JBQWdCLEFBQUMsRUFBRSxNQUFNLENBQXVCLEtBQUs7TUFDdkQsT0FBTTs7c0JBRU4sS0FBQztVQUFPLE9BQU07b0JBQU07O3NCQUNwQixLQUFDO1VBQU8sT0FBTTtvQkFBTzs7c0JBQ3JCLEtBQUM7VUFBTyxPQUFNO29CQUFPOzs7O0VBRzNCO0VBQ0EscUJBQ0UsTUFBQztJQUFJLE9BQU07O29CQUNULEtBQUM7UUFDQyxTQUFTLENBQUM7VUFDUixNQUFNLFdBQVcsT0FBTyxVQUFVLENBQ2hDLEFBQUMsTUFBTSxNQUFNLENBQXNCLEtBQUs7VUFFMUMsU0FBUztZ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
// denoCacheMetadata=10830024024880114065,1447048872547538615