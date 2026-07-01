const { fromBuffer } = require('pdf2pic');
const fs = require('fs');

async function run() {
  const options = {
    density: 100,
    format: "jpeg",
    width: 600,
    height: 600
  };
  const convert = fromBuffer(Buffer.from('JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY31jBQqDUz1DBSKcjP1TQ0UChNTSzLz84BScZVA9ECAj9sCCjCQwACr7wzGZW5kc3RyZWFtCmVuZG9iagoKMyAwIG9iago1MgplbmRvYmoKCjUgMCBvYmoKPDwvTGVuZ3RoIDYgMCBSL0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGgxIDEwOTM2Pj4Kc3RyZWFtCnhcdVc9XBNXEAB3f+xLwQ3uU1yCC5OQyFhMTIiNjTGxiTHGRsZgYmxs4x/GxgY/NsbGxsbY2NjYxsbGxsb2NzY2NrY7u3u793y7d3vvd2f2j89nZ2Z3ZnZ2Z3Z2dudnZ2Z2duf3H1u2bN2ydcvWrdu2bN2ydcvWLVv/B1t6u51ZlQ3f35+b574z/W+/eZub23f8b+X9/9X/Bv8L/h/8f/D/4f/D/w//H/w/+H/w/+D/wf+D/wf/H/w/+H/w/+D/wf+D/wf/D/4f/D/4f/D/4P/B/4P/B/8P/h/8P/h/8P/g/8H/g/8H/w/+H/w/+H/w/+=', 'base64'), options);
  
  try {
    const res = await convert.bulk(-1, { base64: true });
    console.log(res);
  } catch(e) { console.log(e); }
}
run();
