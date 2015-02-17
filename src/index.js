/**
 * TacticalAlert is a helper tool to build data validators. You pass it some options
 * and it returns an object with a couple public methods:
 *
 * isValid: function(data, action_options)
 * Runs all validations against the data. If all pass, returns true. If all fail,
 * returns false and fires a validation failure action, passing along the action_options
 * and the validation errors as `errors` in the action.
 *
 * getValidationErrors: function(key, data)
 * If you just want to run validations against a specific subset of the data, you can
 * use this function. It returns an array of error strings, or an empty array if
 * there were no errors.
 *
 *
 * When you use the Factory function, you can also pass in an object with the following options:
 *
 * validations:
 * An object of arrays. Each key represents a key in the eventual data to be validated.
 * The array contains functions that take the data as a parameter, and return true if
 * the data is valid, or an error string if the validation failed.
 *
 * validation_failed_action_type:
 * The action type that will be dispatched if isValid fails. Defaults to
 * MemoryAlpha.ValidationActions.VALIDATION_FAILED
 *
 *
 * EXAMPLE:
 *
 * var MessageValidator = TacticalAlert({
 *   validation_failed_action_type: Constants.MessageActions.MESSAGE_VALIDATION_FAILED
 *
 *   validations: {
 *     sender_id: [
 *       function(sender_id) {
 *         if (isNaN(sender_id)) {
 *           return 'ID must be a number.';
 *         }
 *         return true;
 *       }
 *     ],
 *
 *     text: [
 *       function(text) {
 *         if (text === '') {
 *           return 'Message can\'t be blank.";
 *         }
 *         return true;
 *       },
 *
 *       function(text) {
 *         if (text.length > 250) {
 *           return "Your message must be 250 characters or shorter.";
 *         }
 *         return true;
 *       }
 *     ]
 *   }
 *
 * });
 *
 */

'use strict';

var MemoryAlpha = require('memory-alpha');
var LCARS = require('lcars');
var merge = require('amp-merge');

var TacticalAlert = function(options) {
  var default_options = {
    validations: [],
    validation_failed_action_type: MemoryAlpha.ValidationActions.VALIDATION_FAILED
  };

  options = options || {};
  options = merge(default_options, options);

  return {
    getValidationErrors: function(key, data) {
      // Retrieve an array of validation error messages. The `data` will be checked
      // against validation for the `key`.
      var validations = options.validations[key];
      var errors = [];

      if (!Array.isArray(validations)) {
        return false;
      }

      // Only run the validations if the data sent in actually exists
      if (typeof data !== 'undefined') {
        validations.forEach(function(validate) {
          var error_message = validate(data);

          // Validators return string error messages if there was a problem.
          if (typeof error_message === 'string') {
            errors.push(error_message);
          }
        });
      }

      return errors;
    },

    isValid: function(data, action_options) {
      // Try validation. Return true if the data is valid. Otherwise return false
      // and fire an invalid data action
      var errors = {};
      var key, key_errors;

      for (key in options.validations) {
        key_errors = this.getValidationErrors(key, data[key]);
        if (key_errors.length > 0) {
          errors[key] = key_errors;
        }
      }

      if (Object.keys(errors).length === 0) {
        return true;
      } else {
        // Create an action
        LCARS.dispatch({
          type: options.validation_failed_action_type,
          options: action_options,
          errors: errors
        });
        return false;
      }
    }
  };
};

module.exports = TacticalAlert;