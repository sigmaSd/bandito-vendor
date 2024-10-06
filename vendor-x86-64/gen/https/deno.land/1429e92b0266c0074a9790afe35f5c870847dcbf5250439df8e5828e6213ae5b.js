import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
const LINK = "https://fresh.deno.dev/docs/concepts/ahead-of-time-builds";
export default function TailwindErrorPage() {
  return /*#__PURE__*/ _jsx("div", {
    class: "frsh-error-page",
    children: /*#__PURE__*/ _jsxs("div", {
      style: "max-width: 48rem; padding: 2rem 1rem; margin: 0 auto; font-family: sans-serif",
      children: [
        /*#__PURE__*/ _jsx("h1", {
          children: "Finish setting up Fresh"
        }),
        /*#__PURE__*/ _jsxs("p", {
          style: "line-height: 1.6;margin-bottom: 1rem;",
          children: [
            "The ",
            /*#__PURE__*/ _jsx("b", {
              children: "tailwindcss"
            }),
            " ",
            "plugin requires ahead of time builds to be set up for production usage. To finish the setup, follow these steps:"
          ]
        }),
        /*#__PURE__*/ _jsxs("ol", {
          style: "line-height: 1.6; margin-bottom: 1.5rem",
          children: [
            /*#__PURE__*/ _jsxs("li", {
              children: [
                "Go to your project in Deno Deploy and click the",
                " ",
                /*#__PURE__*/ _jsx("code", {
                  children: "Settings"
                }),
                " tab."
              ]
            }),
            /*#__PURE__*/ _jsxs("li", {
              children: [
                "In the Git Integration section, enter ",
                /*#__PURE__*/ _jsx("code", {
                  children: "deno task build"
                }),
                " ",
                "in the ",
                /*#__PURE__*/ _jsx("code", {
                  children: "Build Command"
                }),
                " input."
              ]
            }),
            /*#__PURE__*/ _jsx("li", {
              children: "Save the changes."
            })
          ]
        }),
        /*#__PURE__*/ _jsxs("p", {
          children: [
            "See the detailed guide here: ",
            /*#__PURE__*/ _jsx("a", {
              href: LINK,
              children: LINK
            }),
            "."
          ]
        })
      ]
    })
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci90YWlsd2luZF9hb3RfZXJyb3JfcGFnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgTElOSyA9IFwiaHR0cHM6Ly9mcmVzaC5kZW5vLmRldi9kb2NzL2NvbmNlcHRzL2FoZWFkLW9mLXRpbWUtYnVpbGRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRhaWx3aW5kRXJyb3JQYWdlKCkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3M9XCJmcnNoLWVycm9yLXBhZ2VcIj5cbiAgICAgIDxkaXYgc3R5bGU9XCJtYXgtd2lkdGg6IDQ4cmVtOyBwYWRkaW5nOiAycmVtIDFyZW07IG1hcmdpbjogMCBhdXRvOyBmb250LWZhbWlseTogc2Fucy1zZXJpZlwiPlxuICAgICAgICA8aDE+RmluaXNoIHNldHRpbmcgdXAgRnJlc2g8L2gxPlxuICAgICAgICA8cCBzdHlsZT1cImxpbmUtaGVpZ2h0OiAxLjY7bWFyZ2luLWJvdHRvbTogMXJlbTtcIj5cbiAgICAgICAgICBUaGUgPGI+dGFpbHdpbmRjc3M8L2I+e1wiIFwifVxuICAgICAgICAgIHBsdWdpbiByZXF1aXJlcyBhaGVhZCBvZiB0aW1lIGJ1aWxkcyB0byBiZSBzZXQgdXAgZm9yIHByb2R1Y3Rpb25cbiAgICAgICAgICB1c2FnZS4gVG8gZmluaXNoIHRoZSBzZXR1cCwgZm9sbG93IHRoZXNlIHN0ZXBzOlxuICAgICAgICA8L3A+XG4gICAgICAgIDxvbCBzdHlsZT1cImxpbmUtaGVpZ2h0OiAxLjY7IG1hcmdpbi1ib3R0b206IDEuNXJlbVwiPlxuICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgIEdvIHRvIHlvdXIgcHJvamVjdCBpbiBEZW5vIERlcGxveSBhbmQgY2xpY2sgdGhle1wiIFwifVxuICAgICAgICAgICAgPGNvZGU+U2V0dGluZ3M8L2NvZGU+IHRhYi5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgIEluIHRoZSBHaXQgSW50ZWdyYXRpb24gc2VjdGlvbiwgZW50ZXIgPGNvZGU+ZGVubyB0YXNrIGJ1aWxkPC9jb2RlPlxuICAgICAgICAgICAge1wiIFwifVxuICAgICAgICAgICAgaW4gdGhlIDxjb2RlPkJ1aWxkIENvbW1hbmQ8L2NvZGU+IGlucHV0LlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgPGxpPlxuICAgICAgICAgICAgU2F2ZSB0aGUgY2hhbmdlcy5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICA8L29sPlxuICAgICAgICA8cD5cbiAgICAgICAgICBTZWUgdGhlIGRldGFpbGVkIGd1aWRlIGhlcmU6IDxhIGhyZWY9e0xJTkt9PntMSU5LfTwvYT4uXG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLE9BQU87QUFFYixlQUFlLFNBQVM7RUFDdEIscUJBQ0UsS0FBQztJQUFJLE9BQU07Y0FDVCxjQUFBLE1BQUM7TUFBSSxPQUFNOztzQkFDVCxLQUFDO29CQUFHOztzQkFDSixNQUFDO1VBQUUsT0FBTTs7WUFBd0M7MEJBQzNDLEtBQUM7d0JBQUU7O1lBQWdCO1lBQUk7OztzQkFJN0IsTUFBQztVQUFHLE9BQU07OzBCQUNSLE1BQUM7O2dCQUFHO2dCQUM4Qzs4QkFDaEQsS0FBQzs0QkFBSzs7Z0JBQWU7OzswQkFFdkIsTUFBQzs7Z0JBQUc7OEJBQ29DLEtBQUM7NEJBQUs7O2dCQUMzQztnQkFBSTs4QkFDRSxLQUFDOzRCQUFLOztnQkFBb0I7OzswQkFFbkMsS0FBQzt3QkFBRzs7OztzQkFJTixNQUFDOztZQUFFOzBCQUM0QixLQUFDO2NBQUUsTUFBTTt3QkFBTzs7WUFBUzs7Ozs7O0FBS2hFIn0=
// denoCacheMetadata=12454913506027026391,481774162558162297