// Tab switching logic
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
  });
});

const crawler = new ShopifyCrawler();

document.getElementById('startBtn').addEventListener('click', () => {
const baseUrl = document.getElementById('baseUrl').value;
const startPage = parseInt(document.getElementById('startPage').value);
const endPage = parseInt(document.getElementById('endPage').value);
  
crawler.start(baseUrl, startPage, endPage);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  crawler.isPaused = !crawler.isPaused;
});

document.getElementById('stopBtn').addEventListener('click', () => {
  crawler.isRunning = false;
});

document.getElementById('exportCsv').addEventListener('click', () => {
  crawler.exportToCsv();
});

document.getElementById('exportJson').addEventListener('click', () => {
  crawler.exportToJson();
});
