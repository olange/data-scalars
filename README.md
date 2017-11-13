# \<data-scalars\>

Automatic representation of a _scalar_ value as [Polymer Elements](https://elements.polymer-project.org) (Iron and Paper) - in either read-only or editable mode.

`data-scalars` elements consume an immutable _data egg_ data structure and produce suitable Polymer elements to represent that value. The _data egg_ is a simple structure, which contains the _scalar_ value, its _type_ and _logical formatting hints_.

Designed to work hand-in-hand with _data nuggets_ data structures delivered by [`data-pipes`](https://github.com/olange/data-pipes), although both can be used independently.

## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your element locally.

## Viewing Your Element

```
$ polymer serve
```

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.
