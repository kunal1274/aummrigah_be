![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)

How to deploy the project to vercel :
first install the vercel cli :

```bash
npm i -g vercel
```

then configure the vercel.json in the root directory of the project

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

![alt text](image-6.png)

Locally via cli
![alt text](image-5.png)

```bash
vercel dev
```

## item model

![alt text](image-7.png)
