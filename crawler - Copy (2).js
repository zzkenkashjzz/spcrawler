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
          const response = await fetch(`/fetch?url=${encodeURIComponent(fullUrl)}`);
          const html = await response.text();
          
          const doc = new DOMParser().parseFromString(html, 'text/html');
          
          // Get product name
          const name = doc.querySelector('.title_product')?.textContent?.trim() || 'Unknown';
          
          // Get images only from main product gallery
          const images = [];
          const mainGallery = doc.querySelector('.product_gallery');
          if (mainGallery) {
            mainGallery.querySelectorAll('.gallery-cell').forEach(cell => {
              const img = cell.querySelector('img');
              if (img && img.getAttribute('data-src') && img.getAttribute('data-src') !== 'px') {
                const imageData = {
                  src: img.getAttribute('data-src'),
                  alt: img.getAttribute('alt'),
                  title: cell.getAttribute('data-title')
                };
                // Only add images that have valid data-src and are product-specific
                if (imageData.src.includes('mockup')) {
                  images.push(imageData);
                }
              }
            });
          }

          return {
            name,
            images,
            url: fullUrl
          };
        } catch (error) {
          this.log(`Error fetching product: ${error.message}`);
          return null;
        }
      }      
  
    async exportToCsv() {
      const maxImages = Math.max(...this.products.map(p => p.images.length));
  
      // Create headers with separate image columns
      const headers = [
        'Product Name',
        'Product URL',
        ...Array(maxImages).fill(0).map((_, i) => `Image URL ${i + 1}`)
      ];

      const rows = this.products.map(product => {
        // Spread image URLs into separate columns
        const imageColumns = Array(maxImages).fill('').map((_, i) => 
          product.images[i] ? product.images[i].src : ''
        );
    
        return [
          product.name,
          product.url,
          ...imageColumns
        ];
      });

      const csvContent = [
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

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
  