#!/bin/bash

BUILDER_SRC_DIR="./src/builder"
DIST_DIR="./dist"
BUNDLE_JS="$DIST_DIR/bundle.js"
OUT_HTML="$DIST_DIR/storyBuilder.html"

mkdir -p "$DIST_DIR"

# Move all js to a single file
esbuild "$BUILDER_SRC_DIR/main.js" --bundle --minify --outfile="$BUNDLE_JS"

# read css ,js and other html file contents
CSS=$(cat "$BUILDER_SRC_DIR/style.css")
JS=$(cat "$BUNDLE_JS")
HTML_VIEWER=$(cat "src/storyViewer.html")
HTML_BUILDER=$(cat "$BUILDER_SRC_DIR/storyBuilder.html")

# replace or insert with awk: CSS, JS and Viewer incurrentLine to HTML_BUILDER
awk -v css="$CSS" \
    -v js="$JS" \
    -v viewer="$HTML_VIEWER" '
{
    currentLine = $0

    # remove line with insertViewerTemplate.js
    if (line ~ /<script src="insertViewerTemplate\.js"><\/script>/) {
        next
    }
    # replace css
    else if (currentLine ~ /<link rel="stylesheet" type="text\/css" href="style.css">/) {
        print "<style>" css "</style>"
    }
    # replace js
    else if (currentLine ~ /<script src="main.js" type="module"><\/script>/) {
        print "<script>" js "</script>"
    }
    # Insert viewer template to <pre> in BUILDER_HTML
    else if (currentLine ~ /<pre id="storyViewerTemplate">/) {
        print "<pre id=\"storyViewerTemplate\">" viewer "</pre>"
    }
    # OUTPUT ALL OTHER LINES UNCHANGED
    else {
        print currentLine
    }
}
' <<< "$HTML_BUILDER" > "$OUT_HTML"

echo "Bundle created: $OUT_HTML"
