const express = require('express');
const Realm = require('realm');
const cors = require('cors');

const Task = require('./models/Task'); // Task schema
const Tasko = require('./models/Tasko'); // Tasko schema

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Realm app
const realmApp = new Realm.App({ id: "app-tdeydcy", baseUrl: "https://services.cloud.mongodb.com" });
const credentials = Realm.Credentials.emailPassword('s.sriman.2002@gmail.com', 'victoria@69');

let realmInstance;
let connected = false;

// Connect to Realm and create subscriptions with retry mechanism
const connectToRealm = async (retryCount = 0) => {
  try {
    const user = await realmApp.logIn(credentials);

    // Open the realm with flexible sync
    realmInstance = await Realm.open({
      schema: [Task, Tasko],
      sync: { user: realmApp.currentUser, flexible: true },
    });

    // Create or update a subscription for the Task schema
    await realmInstance.subscriptions.update((mutableSubs) => {
      // Add a subscription for all Task objects
      mutableSubs.add(realmInstance.objects("Task"));
    });

    connected = true;
    console.log('Connected to Realm and subscribed to Task schema');
  } catch (error) {
    connected = false;
    console.error('Error connecting to Realm or creating subscription:', error);

    // Retry logic if the connection fails
    if (retryCount < 5) {
      console.log(`Retrying connection... Attempt ${retryCount + 1}`);
      setTimeout(() => connectToRealm(retryCount + 1), 5000); // Retry after 5 seconds
    } else {
      console.log('Failed to connect after multiple attempts.');
    }
  }
};

// Periodically check connection status and reconnect if disconnected
const monitorConnection = () => {
  setInterval(() => {
    if (!connected) {
      console.log('Reconnecting to Realm...');
      connectToRealm();
    }
  }, 10000); // Check every 10 seconds
};

// Call the connection function initially and monitor for disconnects
connectToRealm();
monitorConnection();

// API to fetch all tasks
app.get('/tasks', async (req, res) => {
  try {
    // Ensure the subscription is active before fetching
    if (!realmInstance.subscriptions.isValid) {
      await realmInstance.subscriptions.waitForSynchronization();
    }

    const tasks = realmInstance.objects('Task');
    res.json(tasks);
    console.log("Tasks:", tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// API to add a new task
app.post('/task', async (req, res) => {
  const { title, description, dur, comp, mon, date, status, week } = req.body;
  try {
    // Ensure subscription is active before performing a write
    if (!realmInstance.subscriptions.isValid) {
      await realmInstance.subscriptions.waitForSynchronization();
    }

    realmInstance.write(() => {
      realmInstance.create('Task', {
        _id: `${new Date()}-${title}}`,  // Use ObjectId for unique ID
        title,
        description,
        mon,
        comp, // Assuming a default value
        dur,  // Assuming a default value
        date,  // Ensure date is handled correctly
        status,
        week,  // or set any default if needed
      });
    });

    res.status(201).json({ message: 'Task added successfully' });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// API to update a task
app.put('/task/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, mon, status, date } = req.body;

  try {
    // Ensure subscription is active before performing a write
    if (!realmInstance.subscriptions.isValid) {
      await realmInstance.subscriptions.waitForSynchronization();
    }

    const task = realmInstance.objectForPrimaryKey('Task', id);
    if (task) {
      realmInstance.write(() => {
        task.title = title || task.title;
        task.description = description || task.description;
        task.mon = mon || task.mon;
        task.status = status || task.status;
        task.date = date ? new Date(date) : task.date;
      });
      res.json({ message: 'Task updated successfully' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// API to delete a task
app.delete('/task/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Ensure subscription is active before performing a write
    if (!realmInstance.subscriptions.isValid) {
      await realmInstance.subscriptions.waitForSynchronization();
    }

    const task = realmInstance.objectForPrimaryKey('Task', new id);
    if (task) {
      realmInstance.write(() => {
        realmInstance.delete(task);
      });
      res.json({ message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
