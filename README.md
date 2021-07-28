# PrismJS-Live-Lite
### Demo: https://cyfung1031.github.io/PrismJS-Live-Lite/ ###

## About ##

This is based on the original PrismJS Live hosted in https://github.com/PrismJS/live/

## Differences from LeaVerou's original PrismJS ##
- **No External Library `Bliss.js`**
- **No `prismjs-live-xxx.js`**
- **Not holding the `input` event for Coding Content Update**
- **Replaced all `string.slice(start,end)` to `string.substring(start,end)`**
- **All text nodes are wrapped with `prism-plain`**
- **All `newline` text nodes are wrapped with `prism-plain-newline`**
- **No Replacement of FULL Content of Coding Area, only update the changed DOMs**
- **[Optional] Generate `prism-content-line` for each line (possibly increase performance when editing)**

## Files ##
Required CSS files:

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" integrity="sha512-tN7Ec6zAFaVSG3TpNAKtk4DOHNpSwKHxxrsiw4GHKESGPs5njn/0sMCUMl2svV4wo4BK/rCP7juYz+zx+l6oeQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/line-numbers/prism-line-numbers.min.css" integrity="sha512-cbQXwDFK7lj2Fqfkuxbo5iD1dSbLlJGXGpfTDqbggqjHJeyzx88I3rfwjS38WJag/ihH7lzuGlGHpDBymLirZQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="src/prism-live.css">

Required JavaScript files:

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js" integrity="sha512-axJX7DJduStuBB8ePC8ryGzacZPr3rdLaIDZitiEgWWk2gsXxEFlm4UW0iNzj2h3wp5mOylgHAzBzM4nRSvTZA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/line-numbers/prism-line-numbers.min.js" integrity="sha512-dubtf8xMHSQlExGRQ5R7toxHLgSDZ0K7AunqPWHXmJQ8XyVIG19S1T95gBxlAeGOK02P4Da2RTnQz0Za0H0ebQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="src/prism-live-lite.js"></script>
