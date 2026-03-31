const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/chat-bot')
  .then(async () => {
    const steps = await mongoose.connection.collection('flowsteps').find({}).toArray();
    console.log(JSON.stringify(steps.map(s => ({
      stepId: s.stepId, 
      q: s.question, 
      next: s.nextStep, 
      opts: s.options, 
      px: s.position?.x, 
      py: s.position?.y
    })), null, 2));
    process.exit(0);
  })
  .catch(console.error);
