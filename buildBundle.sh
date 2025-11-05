#!/bin/bash
# support umlaute and other utf8 stuff
export LANG=en_US.UTF-8
set -e

BUILDER_SRC_DIR="./src/builder"
VIEWER_HTML_CONTENT=$(<"./src/storyViewer.html")
DIST_DIR="./dist"
BUNDLE_JS="$DIST_DIR/bundle.js"
OUT_HTML="$DIST_DIR/storyBuilder.html"

mkdir -p "$DIST_DIR"

# check if esbuild is installed
if ! command -v esbuild >/dev/null 2>&1
then
    echo "esbuild not found. Use apt install esbuild. Exiting."
    exit 1
fi

# Move all js to a single file
esbuild "$BUILDER_SRC_DIR/main.js" \
--bundle --minify --charset=utf8 --outfile="$BUNDLE_JS" \
--format=esm --sourcemap --platform=browser

# read css ,js and other html file contents
CSS=$(<"$BUILDER_SRC_DIR/style.css")
JS=$(<"$BUNDLE_JS")

# inline everything
awk -v css="$CSS" -v js="$JS" -v viewer="$VIEWER_HTML_CONTENT" '
function escape_html(str,   out, i, c) {
    out = ""
    for (i = 1; i <= length(str); i++) {
        c = substr(str, i, 1)
        if (c == "&") out = out "&amp;"
        else if (c == "<") out = out "&lt;"
        else if (c == ">") out = out "&gt;"
        else out = out c
    }
    return out
}
{
    if ($0 ~ /<script src="insertViewerTemplate\.js"><\/script>/) next
    else if ($0 ~ /<link rel="stylesheet" type="text\/css" href="style.css">/)
        print "<style>" css "</style>"
    else if ($0 ~ /<script src="main.js" type="module"><\/script>/)
        print "<script>" js "</script>"
    else if ($0 ~ /<pre id="storyViewerTemplate">/) {
        print "<pre id=\"storyViewerTemplate\">"
        n = split(viewer, lines, "\n")
        for (i=1; i<=n; i++) print escape_html(lines[i])
    } else
        print
}
' "$BUILDER_SRC_DIR/storyBuilder.html" > "$OUT_HTML"

echo "Bundle created: $OUT_HTML"