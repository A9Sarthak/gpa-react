import Tesseract from 'tesseract.js';
async function test() {
  try {
    console.log("Creating worker...");
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: m => console.log(m)
    });
    console.log('worker created successfully');
    await worker.terminate();
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
