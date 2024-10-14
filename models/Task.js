const Realm = require('realm');

// Define the Task schema
class Task extends Realm.Object {}
Task.schema = {
  name: 'Task',
  properties: {
    _id: 'string', // Primary key
    date: 'date',
    dur: 'int',
    comp: 'int',
    mon: 'int',
    title: 'string',
    week: 'string[]',
    img: 'string[]',
    status:  'string',// List of strings
  },
  primaryKey: '_id',
};


module.exports = Task;


