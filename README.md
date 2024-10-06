# Bandito Vendor

This is [Bandito](https://github.com/sigmasd/bandito) data vendored.

Its created like this:

```bash
DENO_DIR=$PWD/vendor-x86-64 deno -A webview.ts
```

This is needed for the appimage so it doesn't need any external dependencies.

## TODO

Figure a way to create this on the ci instead of my pc
