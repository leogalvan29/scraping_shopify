

import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';

const app = express()
const port = 3000  

const urlTienda = "urltienda"
const token = "token"
const apiVersion = "apiVersion"


app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.get("/impresoras", (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });

    const page = await browser.newPage();
    await page.goto(""); 
    await page.waitForSelector('[data-hook="product-list-wrapper"]');

    //await page.waitForSelector('[data-hook="product-item-product-details-link"]', {visible:true}) 

    // Cuando tenemos que clikear botones para mostrar mas productos
    //await page.click('[data-hook="load-more-button"]') 
    //await page.click('[data-hook="load-more-button"]') 


    // await new Promise(function(resolve){
    //    setTimeout(resolve, 5000) 
    // })



   

    const productos = await page.evaluate(() => {
      let arr = [];
      const items = document.querySelectorAll('[data-hook="product-list-grid-item"]');

      for (let item of items) {
        const producto = {};

        producto.enlace = item.querySelector("a").href;

        arr.push(producto);
      }

      return arr;
    });

    console.log(productos.length);

    for (let producto of productos) {
      await page.goto(producto.enlace, { waitUntil: "networkidle0" });
      await page.waitForSelector(".vEIMC5");
      producto.productImage = await page.evaluate(
        () =>
          document.querySelector("div > wow-image > img", { timeout: 1000 }).src
      );
      await page.waitForSelector(".Jgs2b9");
      producto.title = await page.evaluate(
        () => document.querySelector("div > h1").textContent
      );
      await page.waitForSelector('[data-hook="product-price"]');
      producto.price = await page.evaluate(
        () =>
          document.querySelector('div > [data-hook="formatted-primary-price"]')
            .innerText
      );
      await page.waitForSelector('[data-hook="content-wrapper"]');
      producto.description = await page.evaluate(
        () => document.querySelector('[data-hook="description"]').textContent
      );
      //console.log(producto.description)
      await timeOut(4000);
    }
    res.send(productos);
    await browser.close();  

   await enviarProductos(productos)
     
      
  })();

  const timeOut = (miliseg) => {
    return new Promise((resolve) => {
      setTimeout(resolve, miliseg);
    });
  };
});


async function enviarProductos(productos){  

  try {
    const resultados = []; // Almacenará los resultados de cada petición

    for (const item of productos) {
      const productoData = {
        product: {
          title: item.title,
          body_html: item.description,
          variants: [
            {
              price: item.price.toString(),
            },
          ],
          images: [
            {
              src: item.productImage,
            },
          ],
        },
      };

      const resultado = await axios.post(`${urlTienda}admin/api/${apiVersion}/products.json`, productoData, {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      });

      resultados.push(resultado); // Agrega el resultado al array
      console.log(`Producto creado: ${resultado.data.product.title}`);
      
      await delay(2000); // Espera 2 segundos antes de continuar con el siguiente producto
    }

    console.log("Todos los productos han sido creados exitosamente.");
  } catch (error) {
    console.error("Se ha producido un error al enviar los productos:", error);
  }

  // try {

  //   const promesaProductos = productos.map((item) => {
  //     const productoData = {
  //          product:{
  //             title:item.title,
  //             body_html:item.description,
  //             variants:[
  //              {
  //                price:item.price.toString()
  //              }
  //             ],
  //             images:[
  //                {
  //                  src:item.productImage
  //                }
  //             ]
  //          }
  //     }
  
  //     return axios.post(`${urlTienda}admin/api/${apiVersion}/products.json`, productoData, {
  //           headers:{
  //            "X-Shopify-Access-Token": token,
  //            "Content-Type": "application/json"
  //           }
  //     })
  // })
  
  // const resultados = await Promise.all(promesaProductos);
  //  console.log("Productos creados exitosamente con imágenes.");
  //  resultados.forEach((resultado, index) => {
  //      console.log(`Producto ${index + 1}:`, resultado.data.product);
  //  });
  
  
    
  // } catch (error) {
  //   console.log(error)
  // }
  
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


