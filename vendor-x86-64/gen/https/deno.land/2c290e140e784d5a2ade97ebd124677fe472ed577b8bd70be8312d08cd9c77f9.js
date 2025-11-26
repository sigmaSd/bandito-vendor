import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
// Just to get some syntax highlighting
const css = (arr, ...exts)=>{
  if (exts.length) throw new Error("Not allowed");
  return arr[0];
};
export const errorCss = css`
  :root {
		--bg: #fff;
		--bg-code-frame: rgb(255, 0, 32, 0.1);
		--bg-active-line: #fbcecc;
		--text: #222;
		--text2: #444;
		--title: #e84644;
		--code: #333;
		font-family: sans-serif;
		line-height: 1.4;
		color: var(--text);
		background: var(--bg);
	}

	* {
		box-sizing: border-box;
		padding: 0;
		margin: 0;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--bg-code-frame: rgba(251, 93, 113, 0.2);
			--bg-active-line: #4f1919;
			--bg: #353535;
			--text: #f7f7f7;
			--text2: #ddd;
			--code: #fdd1d1;
		}
	}

	.inner {
		max-width: 48rem;
		padding: 4rem 1rem;
		margin: 0 auto;
	}

	.title {
		color: var(--title);
		font-weight: normal;
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.code-frame {
		overflow: auto;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background: var(--bg-code-frame);
		color: var(--code);
	}
	.line {
		padding: 0.25rem 0.5rem;
	}
	.active-line {
		display: inline-block;
		width: 100%;
		background: var(--bg-active-line);
	}

	.stack {
		overflow-x: auto;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		color: var(--title);
		display: block;
		width: 3rem;
		height: 3rem;
		background: none;
		border: none;
		transform: translate3d(0, 0, 0);
	}
	.close-btn:active {
		transform: translate3d(0, 2px, 0);
	}
	.close-btn:hover {
		cursor: pointer;
		filter: drop-shadow(0 0 0.75rem crimson);
	}
`;
function CodeFrame(props) {
  const lines = [];
  props.codeFrame.trimEnd().split("\n").forEach((line, i, arr)=>{
    const vnode = /*#__PURE__*/ _jsx("span", {
      class: "line" + (line.startsWith(">") ? " active-line" : ""),
      children: line
    });
    lines.push(vnode);
    if (i < arr.length - 1) lines.push("\n");
  });
  return /*#__PURE__*/ _jsx("pre", {
    class: "code-frame",
    children: /*#__PURE__*/ _jsx("code", {
      children: lines
    })
  });
}
export function ErrorOverlay(props) {
  const url = props.url;
  const title = url.searchParams.get("message") || "Internal Server Error";
  const stack = url.searchParams.get("stack");
  const codeFrame = url.searchParams.get("code-frame");
  return /*#__PURE__*/ _jsxs(_Fragment, {
    children: [
      /*#__PURE__*/ _jsxs("div", {
        class: "frsh-error-page",
        children: [
          /*#__PURE__*/ _jsx("style", {
            dangerouslySetInnerHTML: {
              __html: errorCss
            }
          }),
          /*#__PURE__*/ _jsxs("div", {
            class: "inner",
            children: [
              /*#__PURE__*/ _jsx("div", {
                class: "header",
                children: /*#__PURE__*/ _jsx("button", {
                  class: "close-btn",
                  "aria-label": "close",
                  id: "close-btn",
                  children: /*#__PURE__*/ _jsx("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    strokeWidth: 1.5,
                    stroke: "currentColor",
                    children: /*#__PURE__*/ _jsx("path", {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      d: "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    })
                  })
                })
              }),
              /*#__PURE__*/ _jsxs("div", {
                children: [
                  /*#__PURE__*/ _jsx("h1", {
                    class: "title",
                    children: title
                  }),
                  codeFrame ? /*#__PURE__*/ _jsx(CodeFrame, {
                    codeFrame: codeFrame
                  }) : null,
                  stack ? /*#__PURE__*/ _jsx("pre", {
                    class: "stack",
                    children: stack
                  }) : null
                ]
              })
            ]
          })
        ]
      }),
      /*#__PURE__*/ _jsx("script", {
        dangerouslySetInnerHTML: {
          __html: `document.querySelector("#close-btn").addEventListener("click", () => parent.postMessage("close-error-overlay"));`
        }
      })
    ]
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9lcnJvcl9vdmVybGF5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnRDaGlsZHJlbiwgaCB9IGZyb20gXCJwcmVhY3RcIjtcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gXCIuL3JlbmRlci50c1wiO1xuaW1wb3J0IHsgUGFnZVByb3BzIH0gZnJvbSBcIi4uL3NlcnZlci9tb2QudHNcIjtcblxuLy8gSnVzdCB0byBnZXQgc29tZSBzeW50YXggaGlnaGxpZ2h0aW5nXG5jb25zdCBjc3MgPSAoYXJyOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4uZXh0czogbmV2ZXJbXSkgPT4ge1xuICBpZiAoZXh0cy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk5vdCBhbGxvd2VkXCIpO1xuICByZXR1cm4gYXJyWzBdO1xufTtcblxuZXhwb3J0IGNvbnN0IGVycm9yQ3NzID0gY3NzYFxuICA6cm9vdCB7XG5cdFx0LS1iZzogI2ZmZjtcblx0XHQtLWJnLWNvZGUtZnJhbWU6IHJnYigyNTUsIDAsIDMyLCAwLjEpO1xuXHRcdC0tYmctYWN0aXZlLWxpbmU6ICNmYmNlY2M7XG5cdFx0LS10ZXh0OiAjMjIyO1xuXHRcdC0tdGV4dDI6ICM0NDQ7XG5cdFx0LS10aXRsZTogI2U4NDY0NDtcblx0XHQtLWNvZGU6ICMzMzM7XG5cdFx0Zm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG5cdFx0bGluZS1oZWlnaHQ6IDEuNDtcblx0XHRjb2xvcjogdmFyKC0tdGV4dCk7XG5cdFx0YmFja2dyb3VuZDogdmFyKC0tYmcpO1xuXHR9XG5cblx0KiB7XG5cdFx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcblx0XHRwYWRkaW5nOiAwO1xuXHRcdG1hcmdpbjogMDtcblx0fVxuXG5cdEBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcblx0XHQ6cm9vdCB7XG5cdFx0XHQtLWJnLWNvZGUtZnJhbWU6IHJnYmEoMjUxLCA5MywgMTEzLCAwLjIpO1xuXHRcdFx0LS1iZy1hY3RpdmUtbGluZTogIzRmMTkxOTtcblx0XHRcdC0tYmc6ICMzNTM1MzU7XG5cdFx0XHQtLXRleHQ6ICNmN2Y3Zjc7XG5cdFx0XHQtLXRleHQyOiAjZGRkO1xuXHRcdFx0LS1jb2RlOiAjZmRkMWQxO1xuXHRcdH1cblx0fVxuXG5cdC5pbm5lciB7XG5cdFx0bWF4LXdpZHRoOiA0OHJlbTtcblx0XHRwYWRkaW5nOiA0cmVtIDFyZW07XG5cdFx0bWFyZ2luOiAwIGF1dG87XG5cdH1cblxuXHQudGl0bGUge1xuXHRcdGNvbG9yOiB2YXIoLS10aXRsZSk7XG5cdFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcblx0XHRmb250LXNpemU6IDEuNXJlbTtcblx0XHRtYXJnaW4tYm90dG9tOiAxcmVtO1xuXHR9XG5cblx0LmNvZGUtZnJhbWUge1xuXHRcdG92ZXJmbG93OiBhdXRvO1xuXHRcdHBhZGRpbmc6IDAuNXJlbTtcblx0XHRtYXJnaW4tYm90dG9tOiAwLjVyZW07XG5cdFx0YmFja2dyb3VuZDogdmFyKC0tYmctY29kZS1mcmFtZSk7XG5cdFx0Y29sb3I6IHZhcigtLWNvZGUpO1xuXHR9XG5cdC5saW5lIHtcblx0XHRwYWRkaW5nOiAwLjI1cmVtIDAuNXJlbTtcblx0fVxuXHQuYWN0aXZlLWxpbmUge1xuXHRcdGRpc3BsYXk6IGlubGluZS1ibG9jaztcblx0XHR3aWR0aDogMTAwJTtcblx0XHRiYWNrZ3JvdW5kOiB2YXIoLS1iZy1hY3RpdmUtbGluZSk7XG5cdH1cblxuXHQuc3RhY2sge1xuXHRcdG92ZXJmbG93LXg6IGF1dG87XG5cdH1cblxuXHQuY2xvc2UtYnRuIHtcblx0XHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdFx0dG9wOiAxcmVtO1xuXHRcdHJpZ2h0OiAxcmVtO1xuXHRcdGNvbG9yOiB2YXIoLS10aXRsZSk7XG5cdFx0ZGlzcGxheTogYmxvY2s7XG5cdFx0d2lkdGg6IDNyZW07XG5cdFx0aGVpZ2h0OiAzcmVtO1xuXHRcdGJhY2tncm91bmQ6IG5vbmU7XG5cdFx0Ym9yZGVyOiBub25lO1xuXHRcdHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMCwgMCk7XG5cdH1cblx0LmNsb3NlLWJ0bjphY3RpdmUge1xuXHRcdHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMnB4LCAwKTtcblx0fVxuXHQuY2xvc2UtYnRuOmhvdmVyIHtcblx0XHRjdXJzb3I6IHBvaW50ZXI7XG5cdFx0ZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgMC43NXJlbSBjcmltc29uKTtcblx0fVxuYDtcblxuZnVuY3Rpb24gQ29kZUZyYW1lKHByb3BzOiB7IGNvZGVGcmFtZTogc3RyaW5nIH0pIHtcbiAgY29uc3QgbGluZXM6IENvbXBvbmVudENoaWxkcmVuW10gPSBbXTtcblxuICBwcm9wcy5jb2RlRnJhbWUudHJpbUVuZCgpLnNwbGl0KFwiXFxuXCIpLmZvckVhY2goXG4gICAgKGxpbmUsIGksIGFycikgPT4ge1xuICAgICAgY29uc3Qgdm5vZGUgPSAoXG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3M9e1wibGluZVwiICsgKGxpbmUuc3RhcnRzV2l0aChcIj5cIikgPyBcIiBhY3RpdmUtbGluZVwiIDogXCJcIil9XG4gICAgICAgID5cbiAgICAgICAgICB7bGluZX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgKTtcblxuICAgICAgbGluZXMucHVzaCh2bm9kZSk7XG4gICAgICBpZiAoaSA8IGFyci5sZW5ndGggLSAxKSBsaW5lcy5wdXNoKFwiXFxuXCIpO1xuICAgIH0sXG4gICk7XG4gIHJldHVybiAoXG4gICAgPHByZSBjbGFzcz1cImNvZGUtZnJhbWVcIj5cbiAgICAgIDxjb2RlPntsaW5lc308L2NvZGU+XG4gICAgPC9wcmU+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBFcnJvck92ZXJsYXkocHJvcHM6IFBhZ2VQcm9wcykge1xuICBjb25zdCB1cmwgPSBwcm9wcy51cmw7XG4gIGNvbnN0IHRpdGxlID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJtZXNzYWdlXCIpIHx8IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yXCI7XG4gIGNvbnN0IHN0YWNrID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJzdGFja1wiKTtcbiAgY29uc3QgY29kZUZyYW1lID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJjb2RlLWZyYW1lXCIpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3M9XCJmcnNoLWVycm9yLXBhZ2VcIj5cbiAgICAgICAgPHN0eWxlIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogZXJyb3JDc3MgfX0gLz5cbiAgICAgICAgPGRpdiBjbGFzcz1cImlubmVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImNsb3NlLWJ0blwiIGFyaWEtbGFiZWw9XCJjbG9zZVwiIGlkPVwiY2xvc2UtYnRuXCI+XG4gICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICAgICAgICAgICAgICBmaWxsPVwibm9uZVwiXG4gICAgICAgICAgICAgICAgdmlld0JveD1cIjAgMCAyNCAyNFwiXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9ezEuNX1cbiAgICAgICAgICAgICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgIGQ9XCJNOS43NSA5Ljc1bDQuNSA0LjVtMC00LjVsLTQuNSA0LjVNMjEgMTJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6XCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aDEgY2xhc3M9XCJ0aXRsZVwiPnt0aXRsZX08L2gxPlxuICAgICAgICAgICAge2NvZGVGcmFtZSA/IDxDb2RlRnJhbWUgY29kZUZyYW1lPXtjb2RlRnJhbWV9IC8+IDogbnVsbH1cbiAgICAgICAgICAgIHtzdGFjayA/IDxwcmUgY2xhc3M9XCJzdGFja1wiPntzdGFja308L3ByZT4gOiBudWxsfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNjcmlwdFxuICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17e1xuICAgICAgICAgIF9faHRtbDpcbiAgICAgICAgICAgIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Nsb3NlLWJ0blwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gcGFyZW50LnBvc3RNZXNzYWdlKFwiY2xvc2UtZXJyb3Itb3ZlcmxheVwiKSk7YCxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgPC8+XG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUlBLHVDQUF1QztBQUN2QyxNQUFNLE1BQU0sQ0FBQyxLQUEyQixHQUFHO0VBQ3pDLElBQUksS0FBSyxNQUFNLEVBQUUsTUFBTSxJQUFJLE1BQU07RUFDakMsT0FBTyxHQUFHLENBQUMsRUFBRTtBQUNmO0FBRUEsT0FBTyxNQUFNLFdBQVcsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvRjVCLENBQUMsQ0FBQztBQUVGLFNBQVMsVUFBVSxLQUE0QjtFQUM3QyxNQUFNLFFBQTZCLEVBQUU7RUFFckMsTUFBTSxTQUFTLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLE9BQU8sQ0FDM0MsQ0FBQyxNQUFNLEdBQUc7SUFDUixNQUFNLHNCQUNKLEtBQUM7TUFDQyxPQUFPLFNBQVMsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxPQUFPLGlCQUFpQixFQUFFO2dCQUUxRDs7SUFJTCxNQUFNLElBQUksQ0FBQztJQUNYLElBQUksSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDO0VBQ3JDO0VBRUYscUJBQ0UsS0FBQztJQUFJLE9BQU07Y0FDVCxjQUFBLEtBQUM7Z0JBQU07OztBQUdiO0FBRUEsT0FBTyxTQUFTLGFBQWEsS0FBZ0I7RUFDM0MsTUFBTSxNQUFNLE1BQU0sR0FBRztFQUNyQixNQUFNLFFBQVEsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLGNBQWM7RUFDakQsTUFBTSxRQUFRLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQztFQUNuQyxNQUFNLFlBQVksSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDO0VBRXZDLHFCQUNFOztvQkFDRSxNQUFDO1FBQUksT0FBTTs7d0JBQ1QsS0FBQztZQUFNLHlCQUF5QjtjQUFFLFFBQVE7WUFBUzs7d0JBQ25ELE1BQUM7WUFBSSxPQUFNOzs0QkFDVCxLQUFDO2dCQUFJLE9BQU07MEJBQ1QsY0FBQSxLQUFDO2tCQUFPLE9BQU07a0JBQVksY0FBVztrQkFBUSxJQUFHOzRCQUM5QyxjQUFBLEtBQUM7b0JBQ0MsT0FBTTtvQkFDTixNQUFLO29CQUNMLFNBQVE7b0JBQ1IsYUFBYTtvQkFDYixRQUFPOzhCQUVQLGNBQUEsS0FBQztzQkFDQyxlQUFjO3NCQUNkLGdCQUFlO3NCQUNmLEdBQUU7Ozs7OzRCQUtWLE1BQUM7O2dDQUNDLEtBQUM7b0JBQUcsT0FBTTs4QkFBUzs7a0JBQ2xCLDBCQUFZLEtBQUM7b0JBQVUsV0FBVzt1QkFBZ0I7a0JBQ2xELHNCQUFRLEtBQUM7b0JBQUksT0FBTTs4QkFBUzt1QkFBZTs7Ozs7OztvQkFJbEQsS0FBQztRQUNDLHlCQUF5QjtVQUN2QixRQUNFLENBQUMsZ0hBQWdILENBQUM7UUFDdEg7Ozs7QUFJUiJ9
// denoCacheMetadata=13803163330563939456,10304340936013913609