/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core")
  .filter('filterOr', filterOr);

/**
 * N.B. AngularJS default filter with the following expression:
 *      "person in people | filter: {name: $select.search, age: $select.search}"
 *      performs a AND between 'name: $select.search' and 'age: $select.search'.
 * Instead this filter perform a OR.
 */
function filterOr()
{
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) 
    {
      items.forEach(function(item) 
      {
        var keys = Object.keys(props);

        for (var i = 0, itemMatches=false, numKeys=keys.length; i < numKeys; i++) 
        {
          var prop = keys[i], text = props[prop].toLowerCase();

          if (item[prop] != null && 
            item[prop].toString().toLowerCase().indexOf(text) !== -1) 
          {
            itemMatches = true;
            break;
          }
        }

        if(itemMatches)
          out.push(item);
      });
    } 
    else 
    {
      // Let the output be the input unfiltered
      out = items;
    }

    return out;
  };
}
