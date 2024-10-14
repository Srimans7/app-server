const Realm = require('realm');

// Define the Task schema
class Tasko extends Realm.Object {}

Tasko.schema = {
  name: 'Task1',
  properties: {
    _id: 'string',
    comp: 'int',
    date: 'date',
    dur: 'int',
    img: 'string[]',
    mon: 'int',
    status: 'string',
    title: 'string',
    week: 'string[]',
  },
  primaryKey: '_id',
};

module.exports = Tasko;
