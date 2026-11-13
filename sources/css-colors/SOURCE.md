# css-colors: the named colours of CSS

- **What:** the 148 colour keywords of CSS (CSS Color Module Level 4, "named colors") with their RGB values, as
  listed by the package `color-name`.
- **Origin:** https://github.com/colorjs/color-name , commit `9ec3195524951f58bc1d33797fccc0f8ecfe070c`, file
  `index.js` (sha256 `8567ef2590b5e8a2fa23262a5d3a963e538d91faf0f87365aa74e6eb86f02e97`).
- **Version:** 2.1.1 (`core.source="css-colors 2.1.1"`).
- **License:** MIT (the package). The names and values themselves are those of the CSS specification.
- **Attribution:** color-name, Copyright (c) 2015 Dmitry Ivanov, MIT License, https://github.com/colorjs/color-name .
- **How to fetch:** `mkdir -p sources/css-colors/raw && curl -L -o sources/css-colors/raw/index.js
  https://raw.githubusercontent.com/colorjs/color-name/9ec3195524951f58bc1d33797fccc0f8ecfe070c/index.js` ; then
  `node tools/values-core.mjs`.
- **What is kept:** every keyword and its RGB value. The seven keywords spelt with "gray" are the same colours as
  those with "grey" and become word facts, so 141 colours. The name is the keyword written as words
  (`darkolivegreen`: "dark olive green"); the keyword stays as `css=`.
