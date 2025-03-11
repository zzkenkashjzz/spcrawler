class ShopifyCrawler {
    constructor() {
      this.products = [];
      this.isRunning = false;
      this.isPaused = false;
      this.logElement = document.getElementById('logs');
      this.productsElement = document.getElementById('products');
    }
  
    log(message) {
      const logEntry = document.createElement('div');
      logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
      this.logElement.appendChild(logEntry);
      this.logElement.scrollTop = this.logElement.scrollHeight;
    }
  
    updateUI(product) {
      const productDiv = document.createElement('div');
      productDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p>Images: ${product.images.length}</p>
        <div class="product-images">
          ${product.images.map(img => `<img src="${img.src}" width="100" />`).join('')}
        </div>
      `;
      this.productsElement.appendChild(productDiv);
      this.log(`Added product: ${product.name}`);
    }
  
    async start(baseUrl, startPage, endPage) {
      this.isRunning = true;
      this.log(`Starting crawler: ${baseUrl} from page ${startPage} to ${endPage}`);
      
      for(let page = startPage; page <= endPage; page++) {
        if(!this.isRunning) break;
        if(this.isPaused) {
          await new Promise(resolve => {
            const checkPause = setInterval(() => {
              if(!this.isPaused) {
                clearInterval(checkPause);
                resolve();
              }
            }, 100);
          });
        }
  
        const pageUrl = baseUrl.replace('{page}', page);
        this.log(`Processing page ${page}: ${pageUrl}`);
        const productUrls = await this.getProductUrls(pageUrl);
        this.log(`Found ${productUrls.length} products on page ${page}`);
  
        for(const productUrl of productUrls) {
          const productData = await this.getProductDetails(productUrl);
          if(productData) {
            this.products.push(productData);
            this.updateUI(productData);
          }
        }
      }
      
      this.log('Crawling completed');
    }
  
    async getProductUrls(collectionUrl) {
      try {
        const response = await fetch(`/fetch?url=${encodeURIComponent(collectionUrl)}`);
        const html = await response.text();
        
        const urls = [];
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('a[href*="/products/"]').forEach(link => {
          const href = link.getAttribute('href');
          if(href && href.includes('/products/')) {
            urls.push(href);
          }
        });
        
        return [...new Set(urls)];
      } catch (error) {
        this.log(`Error fetching collection: ${error.message}`);
        return [];
      }
    }
  
    async getProductDetails(productUrl) {
      try {
        const fullUrl = productUrl.startsWith('http') ? productUrl : `https://teecentury.com${productUrl}`;
        const response = await fetch(fullUrl, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124'
          }
        });
        const html = await response.text();
        
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return {
          name: doc.querySelector('.title_product')?.textContent?.trim() || 'Unknown',
          images: Array.from(doc.querySelectorAll('.image-element__wrap img')).map(img => ({
            src: img.getAttribute('data-src') || img.getAttribute('src'),
            srcset: img.getAttribute('data-srcset')
          }))
        };
      } catch (error) {
        this.log(`Error fetching product: ${error.message}`);
        return null;
      }
    }
  
    exportToCsv() {
      const headers = ['Name', 'Image URLs'];
      const csvContent = [
        headers.join(','),
        ...this.products.map(p => {
          const imageUrls = p.images.map(i => i.src).join(';');
          return `"${p.name}","${imageUrls}"`;
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], {type: 'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      a.click();
    }
  
    exportToJson() {
      const jsonContent = JSON.stringify(this.products, null, 2);
      const blob = new Blob([jsonContent], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.json';
      a.click();
    }
  }
  