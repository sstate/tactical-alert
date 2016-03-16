jest.autoMockOff();

describe('TacticalAlert', function() {
  'use strict';

  var MemoryAlpha;
  var Dispatcher;
  var Dispatcher;
  var TacticalAlert;

  var validator;
  var spied_validator;

  // Set up some helper validation functions.
  var validations = {
    isOne: function(data) {
      if (data === 1) {
        return true;
      } else {
        return 'Data must be one.';
      }
    },

    isTwo: function(data) {
      if (data === 2) {
        return true;
      } else {
        return 'Data must be two.';
      }
    },

    isPositive: function(data) {
      if (data >= 0) {
        return true;
      } else {
        return 'Data must be positive.';
      }
    }
  };


  beforeEach(function() {
    TacticalAlert = require('./../index');
  });

  it('is a function', function() {
    expect(typeof TacticalAlert).toEqual('function');
  });

  it('takes a parameter object and returns an object', function() {
    var validator = TacticalAlert({});
    expect(typeof validator).toEqual('object');
  });

  it('creates unique objects every time the function runs', function() {
    var v1 = TacticalAlert({});
    var v2 = TacticalAlert({});
    expect(v1).not.toEqual(v2);
  });

  describe('returned object', function() {
    beforeEach(function() {
      validator = TacticalAlert({
        validations: {
          one: [ validations.isOne, validations.isPositive ],
          two: [ validations.isTwo, validations.isPositive ]
        }
      });

      spyOn(validations, 'isOne');
      spyOn(validations, 'isPositive');
      spyOn(validations, 'isTwo');

      spied_validator = TacticalAlert({
        validations: {
          one: [ validations.isOne, validations.isPositive ],
          two: [ validations.isTwo, validations.isPositive ]
        }
      });

      MemoryAlpha = require('memory-alpha');
      Dispatcher = require('welp').WelpDispatcher;
      spyOn(Dispatcher, 'dispatch');
    });

    it('has two function members', function() {
      expect(Object.keys(validator).length).toEqual(2);
      expect(typeof validator.isValid).toEqual('function');
      expect(typeof validator.getValidationErrors).toEqual('function');
    });

    describe('isValid function', function() {
      it('runs every validation passed into the Factory on all keys', function() {
        spied_validator.isValid({ one: 1, two: 2 });
        expect(validations.isOne).toHaveBeenCalled();
        expect(validations.isOne.calls.count()).toEqual(1);

        expect(validations.isTwo).toHaveBeenCalled();
        expect(validations.isTwo.calls.count()).toEqual(1);

        expect(validations.isPositive).toHaveBeenCalled();
        expect(validations.isPositive.calls.count()).toEqual(2);
      });

      it('returns true if all data passes validation', function() {
        expect(validator.isValid({ one: 1, two: 2 })).toEqual(true);
      });

      it('returns false if any data fails validation', function() {
        expect(validator.isValid({ one: -2, two: 6 })).toEqual(false);
      });

      it('fires a VALIDATION_FAILED action if any data fails validation', function() {
        var dispatched_action;

        validator.isValid({ one: -2, two: 6 });
        expect(Dispatcher.dispatch).toHaveBeenCalled();

        dispatched_action = Dispatcher.dispatch.calls.argsFor(0)[0];
        expect(dispatched_action.type).toEqual(MemoryAlpha.ValidationActions.VALIDATION_FAILED);
      });
    });

    describe('getValidationErrors function', function() {
      it('runs every validation passed into the Factory on the specified key', function() {
        spied_validator.getValidationErrors('one', 1);

        expect(validations.isOne).toHaveBeenCalled();
        expect(validations.isOne.calls.count()).toEqual(1);

        expect(validations.isPositive).toHaveBeenCalled();
        expect(validations.isPositive.calls.count()).toEqual(1);

        expect(validations.isTwo).not.toHaveBeenCalled();


        spied_validator.getValidationErrors('two', 2);
        expect(validations.isTwo).toHaveBeenCalled();
        expect(validations.isTwo.calls.count()).toEqual(1);
        expect(validations.isPositive.calls.count()).toEqual(2);
      });

      it('does not run validations against undefined input', function() {
        var errors = validator.getValidationErrors('one', undefined);
        expect(errors).toEqual([]);
      });

      it('returns an empty array if the data passes all validations', function() {
        expect(validator.getValidationErrors('one', 1)).toEqual([]);
        expect(validator.getValidationErrors('two', 2)).toEqual([]);
      });

      it('returns an array with strings for every failed validation', function() {
        var errors = validator.getValidationErrors('one', 99);

        expect(Array.isArray(errors)).toEqual(true);
        expect(errors.length).toBeGreaterThan(0);
        for (var i = 0; i < errors.length; i++) {
          expect(typeof errors[i]).toEqual('string');
        }
      });
    });
  });
});