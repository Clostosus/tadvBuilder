**Why a set coding style is important** <br>
This project is an open source project. To get open source working as intended, many people should be able to read the code. 

## Coding style for tadvBuilder

### Functions
* Function names use [camelCase](http://www.wikipedia.org/wiki/Camelcase) without underscores.
* Opening curly bracket **{** for a function starts on the next line.
* Use Foo() instead of Foo(void).

```javascript
function doSomething()
{
}
```

### Variables
* Variable names are all lowercase, and use "_" as separator.
* For multiple instances, use numbers "scene1, scene2" or postfixes "scene_current", "scene_next".
* Declare variables upon first usage.
* Declare iterators in their loop.
* Use `let` or `const` instead of `var` for declaring variables.

```javascript
let n_scenes = 10;
let scene_current = "scene1";
let scene_next = "scene2";

for (let i = 0;i<10;i++){
    // do something
}
```

### Classes
* Class names use PascalCase.
* Use "this" for accessing member variables.

### Enumerations
* enum values use UPPERCASE.

## Commit Messages
The first line of a message must match:

```
<keyword>: <details>
```

Keywords can either be **user-facing** or **developer-facing**.

For **user-facing** changes, we have these keywords:
* Feature: Adding a significant new functionality. This can be small in code-size, but is meant for the bigger things from a user perspective.
* Add: Similar to Feature, but for small functionalities.
* Change: Changing existing behaviour to an extent the user needs to know about it.
* Fix: Fixing an issue (as seen by the user).
* Remove: Completely removing a functionality.
* Revert: Reverting an earlier Feature / Add / Change / Fix / Remove.

For **developer-facing** changes, we have these keywords:
For developer-facing changes, we have these keywords:
* Codechange: Changes to the code the user is not going to notice. Refactors, modernization, etc.
* Cleanup: Similar to Codechange, but when it is more about removing old code, rather than an actual change.
* Codefix: Fixing problems in earlier commits that the user is not actually going to notice. Wrong comments, missing files, CI changes.