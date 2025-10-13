#!/bin/bash
# support umlaute and other utf8 stuff
export LANG=en_US.UTF-8
set -e

BUILDER_SRC_DIR="./src/builder"
DIST_DIR="./dist"
BUNDLE_JS="$DIST_DIR/bundle.js"
OUT_HTML="$DIST_DIR/storyBuilder.html"

mkdir -p "$DIST_DIR"

# Move all js to a single file
esbuild "$BUILDER_SRC_DIR/main.js" --bundle --minify --charset=utf8 --outfile="$BUNDLE_JS"

# read css ,js and other html file contents
CSS=$(<"$BUILDER_SRC_DIR/style.css")
JS=$(<"$BUNDLE_JS")
HTML_BUILDER=$(<"$BUILDER_SRC_DIR/storyBuilder.html")

# inline everything
awk -v css="$CSS" \
    -v js="$JS" '
{
    currentLine = $0

    if (currentLine ~ /<script src="insertViewerTemplate\.js"><\/script>/) next
    else if (currentLine ~ /<link rel="stylesheet" type="text\/css" href="style.css">/)
        print "<style>" css "</style>"
    else if (currentLine ~ /<script src="main.js" type="module"><\/script>/)
        print "<script>" js "</script>"
    else if (currentLine ~ /<pre id="storyViewerTemplate">/) {
        print "<pre id=\"storyViewerTemplate\">"
        # escape html:
        system("cat src/storyViewer.html | sed \"s/&/\\&amp;/g; s/</\\&lt;/g; s/>/\\&gt;/g\"")
    } else
        print currentLine
}
' <<< "$HTML_BUILDER" > "$OUT_HTML"

echo "Bundle created: $OUT_HTML"