const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Gunakan CORS middleware
app.use(cors());

// Middleware untuk memeriksa dan memblokir akses view-source
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (req.url.includes('view-source') || ua.includes('view-source')) {
    return res.status(403).send('403 Forbidden');
  }
  next();
});
// Middleware untuk /public
app.use('/public', (req, res, next) => {
  if (req.headers.referer) {
    // Kalau file public dipanggil dari dalam website (ada referer), izinkan
    express.static(path.join(__dirname, 'public'))(req, res, next);
  } else {
    // Kalau langsung akses public/xxx di browser, kasih 404 keren
    res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 Not Found</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background-color: #121212;
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      position: relative;
    }
    
    .container {
      text-align: center;
      padding: 2rem;
      z-index: 10;
    }
    
    .error-code {
      font-size: 12rem;
      font-weight: 900;
      color: #fff;
      position: relative;
      margin-bottom: 1rem;
      text-shadow: 
        0 0 10px #00aaff,
        0 0 20px #00aaff,
        0 0 30px #00aaff,
        0 0 40px #ff00e0;
      animation: pulse 2s infinite;
      letter-spacing: 5px;
    }
    
    @keyframes pulse {
      0% {
        text-shadow: 
          0 0 10px #00aaff,
          0 0 20px #00aaff,
          0 0 30px #00aaff,
          0 0 40px #ff00e0;
      }
      50% {
        text-shadow: 
          0 0 20px #00aaff,
          0 0 30px #00aaff,
          0 0 40px #00aaff,
          0 0 50px #ff00e0,
          0 0 60px #ff00e0;
      }
      100% {
        text-shadow: 
          0 0 10px #00aaff,
          0 0 20px #00aaff,
          0 0 30px #00aaff,
          0 0 40px #ff00e0;
      }
    }
    
    .message {
      font-size: 2rem;
      margin-bottom: 2rem;
      color: #ffffff;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    
    .emoji {
      font-size: 3rem;
      display: inline-block;
      animation: spin 3s ease-in-out infinite;
      margin-left: 0.5rem;
    }
    
    .home-button {
      display: inline-block;
      background: linear-gradient(45deg, #ff00e0, #00aaff);
      color: white;
      font-weight: bold;
      padding: 1rem 2rem;
      border-radius: 50px;
      text-decoration: none;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 170, 255, 0.4);
      position: relative;
      overflow: hidden;
    }
    
    .home-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 170, 255, 0.6);
    }
    
    .home-button::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: 0.5s;
    }
    
    .home-button:hover::before {
      left: 100%;
    }
    
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .particle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.3;
      animation: move-particles 15s infinite linear;
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(20deg);
      }
      50% {
        transform: rotate(0deg);
      }
      75% {
        transform: rotate(-20deg);
      }
      100% {
        transform: rotate(0deg);
      }
    }
    
    @keyframes move-particles {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
      }
      100% {
        transform: translateY(-1000px) translateX(500px) rotate(360deg);
      }
    }
    
    @media (max-width: 768px) {
      .error-code {
        font-size: 6rem;
      }
      
      .message {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>
  
  <div class="container">
    <h1 class="error-code">404</h1>
    <h2 class="message">Maaf Sekali Source Ini Gak Bisa Di Akses Hahahahaha<span class="emoji">🤨</span></h2>
    <a href="/" class="home-button">Balik ke Home</a>
  </div>
  
<script>
    // Create particles
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }
    
    function createParticle() {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random particle properties
      const size = Math.random() * 5 + 1;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100 + 100;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 5;
      
      // Get random color from gradient
      const colors = ['#ff00e0', '#aa00ff', '#5500ff', '#0066ff', '#00aaff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = posX + '%';
      particle.style.top = posY + '%';
      particle.style.backgroundColor = color;
      particle.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + color;
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = delay + 's';
      
      particlesContainer.appendChild(particle);
    }
</script>
</body>
</html>
    `);
  }
});
// Serve file HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pterodactyl.html'));
});

app.get('/virtualprivateserver', (req, res) => {
  res.sendFile(path.join(__dirname, 'produkvps.html'));
});

// 404 handler (harus di paling bawah)
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});