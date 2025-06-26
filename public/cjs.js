//~~~~~~~~~~~~~~~~~~~~~ { Settings } ~~~~~~~~~~~~~~~~~~~~~~//
const settings = {
  apiSimpel: 'new2025', // Your API key for payment processing
  ptla_api: 'ptla_dh7us9Eiknof6CDSZqk6CWoS73qUcdCNDI7VYNLUfdn', // Pterodactyl API key isi Juga Line 161
  domain: 'https://lubyzprivat.tamapriv.my.id', // Isi Juga Line 161
  domainkey: 'https://lubyzprivat.tamapriv.my.id', // Pterodactyl panel URL
  MERCHANT_ID: 'OK822491',
  KEYORKUT: '836870117503314611998313OKCTD9535ACD907E3577A9B9BDFA2915551C',
  SIMPELZ_API: 'https://simpelz.fahriofficial.my.id/api/orkut', // Simpelz API base URL
  QR_CODE_URL: '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214054490719799990303UMI51440014ID.CO.QRIS.WWW0215ID20243394995900303UMI5204541153033605802ID5921RIZAL STORE OK19983136010TANAH LAUT61057081262070703A0163047FE8', // QR code 
  EXPIRATION_TIME: 600000, // 10 minutes in milliseconds
  PAYMENT_API_URL: 'https://simpelz.fahriofficial.my.id/api/orkut/createpayment'
};
//~~~~~~~~~~~~~~~~~~~~~ { Settings } ~~~~~~~~~~~~~~~~~~~~~~//

//~~~~~~~~~~~~~~~~~~~~~ { Database } ~~~~~~~~~~~~~~~~~~~~~~//
// Debug mode
const DEBUG_MODE = false;
let currentQrUrl = '';
let polling = null;
let startTime = 0;
let selectedProduct = null;
let selectedPrice = 0;

// Debug log function
function debugLog(message) {
if (DEBUG_MODE) {
  console.log('[DEBUG] ' + message);
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo) {
    const timestamp = new Date().toLocaleTimeString();
    debugInfo.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    debugInfo.scrollTop = debugInfo.scrollHeight;
  }
}
}

// Show debug panel in debug mode
if (DEBUG_MODE) {
document.getElementById('debugPanel').style.display = 'block';
}

// Logout function
function logout() {
debugLog("Logging out");
sessionStorage.removeItem("loggedIn");
window.location.href = '/';  // Redirect to login page
}

// Show product selection, hide welcome screen
function showProductSection() {
debugLog("Showing product section");
document.getElementById("welcomeScreen").style.display = "none";
document.getElementById("productSection").style.display = "block";
document.getElementById("paymentForm").style.display = "none";
document.getElementById("successMessage").style.display = "none";
}

// Go back to welcome screen
function backToWelcome() {
debugLog("Going back to welcome screen");
document.getElementById("welcomeScreen").style.display = "flex";
document.getElementById("productSection").style.display = "none";
document.getElementById("paymentForm").style.display = "none";
document.getElementById("successMessage").style.display = "none";
}

// Go back to product selection
function backToProductSection() {
debugLog("Going back to product selection");
document.getElementById("productSection").style.display = "block";
document.getElementById("paymentForm").style.display = "none";
}

// Select a product
function selectProduct(element, product, price) {
debugLog(`Selecting product: ${product}, price: ${price}`);
// Remove selected class from all products
const products = document.querySelectorAll('.product-card');
products.forEach(prod => prod.classList.remove('selected'));

// Add selected class to clicked product
element.classList.add('selected');

// Store selected product and price
selectedProduct = product;
selectedPrice = price;

// Show continue button
document.getElementById('continueToPayment').style.display = 'block';
}

// Show payment form
function showPaymentForm() {
if (!selectedProduct) {
  alert("Silakan pilih paket terlebih dahulu.");
  return;
}

debugLog(`Showing payment form for ${selectedProduct} at Rp${selectedPrice}`);

// Update order summary
document.getElementById('summaryPackage').innerText = selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1);
document.getElementById('summaryPrice').innerText = selectedPrice;

// Show payment form
document.getElementById("productSection").style.display = "none";
document.getElementById("paymentForm").style.display = "block";
}

// Generate random numbers
function generateRandom(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Format amount
function formatAmount(amount) {
return amount.toFixed(0);
}

// Inject amount to QR string
function injectAmountToQrString(qrString, newAmount) {
const amountStr = formatAmount(newAmount);
return qrString.replace(/(5204)(\d+)/, (match, tag, oldAmount) => tag + amountStr);
}

// Copy QR URL
function copyQrUrl() {
if (currentQrUrl) {
  navigator.clipboard.writeText(currentQrUrl)
    .then(() => {
      alert("URL gambar QR berhasil disalin!");
      debugLog("QR URL copied to clipboard");
    })
    .catch(err => {
      alert("Gagal salin URL: " + err);
      debugLog("Error copying QR URL: " + err);
    });
}
}

// Copy account info
function copyAccountInfo() {
const username = document.getElementById('accountUsername').innerText;
const password = document.getElementById('accountPassword').innerText;
const url = document.getElementById('panelUrl').innerText;

const text = `Username: ${username}\nPassword: ${password}\nPanel URL: ${url}`;

navigator.clipboard.writeText(text)
  .then(() => {
    alert("Informasi akun berhasil disalin!");
    debugLog("Account info copied to clipboard");
  })
  .catch(err => {
    alert("Gagal salin informasi: " + err);
    debugLog("Error copying account info: " + err);
  });
}
// Modified version of the createPterodactylAccount function with more robust error handling
async function createPterodactylAccount(email, product) {
  // Make sure settings are initialized
  if (typeof initializeSettings === 'function') {
    initializeSettings();
  }

  // Konfigurasi tetap (kalau mau user yg isi, bisa jadi parameter)
  const domain = settings.domain;
  const apikey = "ptla_dh7us9Eiknof6CDSZqk6CWoS73qUcdCNDI7VYNLUfdn";

  // Enhanced debugging
  console.log("Creating Pterodactyl account with parameters:", { 
    email: email,
    product: product,
    domain: domain,
    apikey: apikey ? "Set (hidden for security)" : "Not set" 
  });

  // Check for missing parameters with more detailed errors
  if (!email) {
    console.error("Missing email parameter");
    return { success: false, error: "Email is required" };
  }

  if (!domain) {
    console.error("Missing domain parameter in settings");
    return { success: false, error: "Pterodactyl domain not configured" };
  }

  if (!apikey) {
    console.error("Missing API key parameter in settings");
    return { success: false, error: "Pterodactyl API key not configured" };
  }

  // Generate info user
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const firstName = username.charAt(0).toUpperCase() + username.slice(1);
  const lastName = "User";
  // Generate password yang kuat
  const password = generateStrongPassword(username);
  console.log("Creating user:", username);

  try {
    // Buat URL untuk request ke API simpelz
    const url = `https://simpelz.fahriofficial.my.id/api/pterodactyl/create-user?domain=${encodeURIComponent(domain)}&apikey=${apikey}&email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&password=${password}`;

    console.log("Calling Pterodactyl API to create user...");
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    // Cek jika gagal
    if (!data.success || !data.user) {
      throw new Error("Gagal membuat user: " + JSON.stringify(data));
    }

    // Log success untuk debugging
    console.log("User created successfully:", data.user.id);

    return {
      success: true,
      account: {
        id: data.user.id,
        uuid: data.user.uuid,
        username: data.user.username,
        password: data.user.password,
        panelUrl: domain
      }
    };
  } catch (error) {
    console.error("Gagal membuat akun Pterodactyl:", error);
    return {
      success: false,
      error: error.message || "Unknown error"
    };
  }
}


// Function untuk generate password yang lebih kuat
function generateStrongPassword(username) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = username.substring(0, 4); // Ambil 4 karakter pertama dari username

  // Tambah 8 karakter random
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

// Kode QR default
const kodeQrDefault = settings.QR_CODE_URL;

function debugLog(message) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`);
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
      debugOutput.innerHTML += `<div>${message}</div>`;
    }
  }
}

// Helper function untuk generate ID random
function generateRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function untuk inject amount ke QR string
function injectAmountToQrString(qrString, amount) {
  // Implement sesuai kebutuhan
  return qrString.replace('{amount}', amount);
}
// Start payment process
async function startPayment() {
  const email = document.getElementById("email").value;
  debugLog(`Starting payment process for ${selectedProduct}, amount: ${selectedPrice}, email: ${email}`);

  if (!email) {
    alert("Masukkan email Anda.");
    return;
  }

  if (!selectedProduct || !selectedPrice) {
    alert("Terjadi kesalahan. Silakan pilih paket kembali.");
    return;
  }

  document.getElementById("loading").style.display = "block";
  document.getElementById("info").style.display = "none";
  document.getElementById("status").style.display = "none";
  const idPembayaran = generateRandom(1000000000, 9999999999);
  debugLog(`Generated payment ID: ${idPembayaran}`);

  try {
    const qrFinal = injectAmountToQrString(kodeQrDefault, selectedPrice);
    const encodedQR = encodeURIComponent(qrFinal);
    const apiKey = settings.apiSimpel;
    const createUrl = `https://simpelz.fahriofficial.my.id/api/orkut/createpayment?apikey=${apiKey}&amount=${selectedPrice}&codeqr=${encodeURIComponent(kodeQrDefault)}`;

    debugLog(`Calling API: ${createUrl}`);

    let data;
    if (DEBUG_MODE) {
      debugLog("DEBUG MODE: Simulating API response");
      data = {
        status: true,
        result: {
          transactionId: "TX" + Date.now(),
          amount: selectedPrice,
          qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodedQR
        }
      };
    } else {
      const res = await fetch(createUrl);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      data = await res.json();
    }

    debugLog("API Response: " + JSON.stringify(data));

    document.getElementById("loading").style.display = "none";

    if (data.status) {
      currentQrUrl = data.result.qrImageUrl;
      document.getElementById("info").style.display = "block";
      document.getElementById("status").style.display = "block";
      document.getElementById("idPembayaran").innerText = idPembayaran;
      document.getElementById("trxId").innerText = data.result.transactionId;
      document.getElementById("total").innerText = data.result.amount;
      document.getElementById("expired").innerText = "10 Menit dari sekarang";
      document.getElementById("qrImageUrl").innerText = data.result.qrImageUrl;
// Sembunyikan tombol Bayar, tampilkan tombol Cancel
document.getElementById("startButton").style.display = "none";
document.getElementById("cancelButton").style.display = "block";

      const qrImage = document.getElementById("qrImage");
      if (qrImage) {
        qrImage.src = data.result.qrImageUrl;
        qrImage.onerror = function() {
          debugLog("QR image failed to load");
          this.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodedQR;
        };
      }
      startTime = Date.now();
      startPolling(data.result.amount, data.result.transactionId, email);
    } else {
      alert("Gagal membuat pembayaran: " + (data.message || "Unknown error"));
      debugLog("Payment creation failed: " + (data.message || "Unknown error"));
    }
  } catch (error) {
    document.getElementById("loading").style.display = "none";
    console.error("Error saat membuat pembayaran:", error);
    debugLog("Payment creation error: " + error);
    alert("Terjadi kesalahan saat membuat pembayaran.");
  }
}

// Start polling for payment status
function startPolling(targetAmount, transactionId, email) {
  debugLog(`Starting payment status polling for amount: ${targetAmount}, txID: ${transactionId}`);
  const apiKey = settings.apiSimpel;
  const keyorkut = settings.KEYORKUT;
  const merchant = settings.MERCHANT_ID;
  const statusDiv = document.getElementById("status");

  if (!statusDiv) {
    console.error("Status div not found!");
    return;
  }

  statusDiv.innerText = "⏳ Menunggu pembayaran...";
  statusDiv.className = "";
  statusDiv.style.display = "block";

  if (polling) {
    clearInterval(polling);
    debugLog("Cleared previous polling interval");
  }

  polling = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    debugLog(`Polling payment status, elapsed time: ${Math.floor(elapsed/1000)}s`);

    if (elapsed > 600000) {
      clearInterval(polling);
      statusDiv.innerText = "⚠️ QRIS Expired!";
      statusDiv.className = "expired";
      debugLog("Payment expired after 10 minutes");
      return;
    }

    try {
      let data;
      if (DEBUG_MODE) {
        // Simulate payment status
        // After 10 seconds, simulate successful payment
        if (elapsed > 10000) {
          data = { 
            type: "CR", 
            amount: targetAmount 
          };
          debugLog("DEBUG MODE: Simulating successful payment");
        } else {
          data = { type: "WAITING" };
          debugLog("DEBUG MODE: Simulating waiting for payment");
        }
      } else {
        const res = await fetch(`https://simpelz.fahriofficial.my.id/api/orkut/cekstatus?apikey=${apiKey}&merchant=${merchant}&keyorkut=${keyorkut}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        data = await res.json();
      }

      debugLog("Status polling result: " + JSON.stringify(data));

      // Check payment status
      if (data && data.type === "CR" && Number(data.amount) === Number(targetAmount)) {
        clearInterval(polling);
        statusDiv.innerText = "✅ Pembayaran Berhasil!";
        statusDiv.className = "success";
        debugLog("Payment successful!");

        // Create Pterodactyl account
        const accountResult = await createPterodactylAccount(email, selectedProduct);

        if (accountResult.success) {
          debugLog(`Account created successfully: ${JSON.stringify(accountResult.account)}`);

          // Show success message with account details
          setTimeout(() => {
            const paymentForm = document.getElementById("paymentForm");
            const successMessage = document.getElementById("successMessage");

            if (paymentForm && successMessage) {
              paymentForm.style.display = "none";
              successMessage.style.display = "block";

              // Update account info
              document.getElementById("accountUsername").innerText = accountResult.account.username;
              document.getElementById("accountPassword").innerText = accountResult.account.password;
              document.getElementById("panelUrl").innerText = accountResult.account.panelUrl;
            } else {
              debugLog("Required DOM elements not found");
              alert("Pembayaran berhasil! Akun telah dibuat. Username: " + accountResult.account.username + ", Password: " + accountResult.account.password);
            }
          }, 1500);
        } else {
          debugLog("Failed to create account: " + (accountResult.error || "Unknown error"));
          alert("Pembayaran diterima tetapi gagal membuat akun. Silakan hubungi admin. Error: " + (accountResult.error || "Unknown error"));
        }
      }

    } catch (err) {
      debugLog("Polling error: " + err);
    }
  }, 3000);
}

// Check payment status manually
async function checkStatusNow() {
  debugLog("Manual status check initiated");
  const apiKey = settings.apiSimpel;
  const keyorkut = settings.KEYORKUT;
  const merchant = settings.MERCHANT_ID;
  const statusDiv = document.getElementById("status");
  const trxIdElement = document.getElementById("trxId");
  const totalElement = document.getElementById("total");
  const emailElement = document.getElementById("email");

  if (!statusDiv || !trxIdElement || !totalElement || !emailElement) {
    console.error("Required DOM elements not found!");
    alert("Error: Required page elements not found. Please refresh the page.");
    return;
  }

  const transactionId = trxIdElement.innerText;
  const email = emailElement.value;

  statusDiv.innerText = "🔄 Mengecek status sekarang...";
  statusDiv.className = "";

  try {
    let data;
    if (DEBUG_MODE) {
      // Simulate payment status
      const shouldSucceed = Math.random() > 0.5; // 50% success rate
      if (shouldSucceed) {
        data = { 
          type: "CR", 
          amount: totalElement.innerText 
        };
      } else {
        data = { type: "WAITING" };
        debugLog("DEBUG MODE: Simulating payment not found on manual check");
      }
    } else {
      const res = await fetch(`https://simpelz.fahriofficial.my.id/api/orkut/cekstatus?apikey=${apiKey}&merchant=${merchant}&keyorkut=${keyorkut}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      data = await res.json();
    }

    debugLog("Manual check result: " + JSON.stringify(data));

    const targetAmount = Number(totalElement.innerText);

    if (data && data.type === "CR" && Number(data.amount) === targetAmount) {
      if (polling) {
        clearInterval(polling);
      }
      statusDiv.innerText = "✅ Pembayaran Berhasil (Cek Manual)!";
      statusDiv.className = "success";
      debugLog("Manual check confirmed successful payment");

      // Create Pterodactyl account
      const accountResult = await createPterodactylAccount(email, selectedProduct);

      if (accountResult.success) {
        debugLog(`Account created successfully: ${JSON.stringify(accountResult.account)}`);

        // Show success message with account details
        setTimeout(() => {
          const paymentForm = document.getElementById("paymentForm");
          const successMessage = document.getElementById("successMessage");

          if (paymentForm && successMessage) {
            paymentForm.style.display = "none";
            successMessage.style.display = "block";

            // Update account info
            document.getElementById("accountUsername").innerText = accountResult.account.username;
            document.getElementById("accountPassword").innerText = accountResult.account.password;
            document.getElementById("panelUrl").innerText = accountResult.account.panelUrl;
          } else {
            debugLog("Required DOM elements not found");
            alert("Pembayaran berhasil! Akun telah dibuat. Username: " + accountResult.account.username + ", Password: " + accountResult.account.password);
          }
        }, 1500);
      } else {
        debugLog("Failed to create account: " + (accountResult.error || "Unknown error"));
        alert("Pembayaran diterima tetapi gagal membuat akun. Silakan hubungi admin. Error: " + (accountResult.error || "Unknown error"));
      }
    } else {
      statusDiv.innerText = "❌ Belum ada pembayaran terdeteksi.";
      debugLog("No payment detected on manual check");
    }

  } catch (err) {
    debugLog("Manual check error: " + err);
    statusDiv.innerText = "❌ Error saat cek status manual.";
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, scripts initialized');
  if (DEBUG_MODE) {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
      debugPanel.style.display = 'block';
    } else {
      console.log('Debug panel element not found');
    }
  }
});

//===== ( Function Buka Tutup ) =====//
function toggleRules() {
  const rulesContent = document.getElementById("rulesContent");
  rulesContent.classList.toggle("active");

  // Jika baru dibuka, trigger animasi list item
  if (rulesContent.classList.contains("active")) {
      const listItems = rulesContent.querySelectorAll("li");
      listItems.forEach((item, index) => {
          item.style.animationDelay = `${index * 0.05}s`; // Delay sedikit biar muncul bertahap
      });
  }
}
//===== ( Funcation Cancel ) ======//
function cancelPayment() {
  console.log("Pembayaran dibatalkan");

  // Reset tampilan pembayaran
  document.getElementById("loading").style.display = "none";
  document.getElementById("info").style.display = "none";
  document.getElementById("status").style.display = "none";

  // Sembunyikan tombol Cancel dan tampilkan tombol Bayar kembali
  document.getElementById("cancelButton").style.display = "none"; // Sembunyikan Cancel
  document.getElementById("startButton").style.display = "block"; // Tampilkan Bayar

  // Reset QR dan data pembayaran
  currentQrUrl = null;
  selectedProduct = null;
  selectedPrice = null;
}

//===== ( Funcation Notifikasi ) =====//
// Function to show image preview
document.addEventListener('DOMContentLoaded', function() {
// Check if element exists to prevent errors
const proofImageInput = document.getElementById('proofImage');
if (proofImageInput) {
  proofImageInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const previewImg = document.getElementById('previewImg');
        previewImg.src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

// Show "Other" payment method field if "Other" is selected
const paymentMethodSelect = document.getElementById('paymentMethod');
const otherMethodContainer = document.getElementById('otherMethodContainer');

if (paymentMethodSelect && otherMethodContainer) {
  paymentMethodSelect.addEventListener('change', function() {
    if (this.value === 'Other') {
      otherMethodContainer.style.display = 'block';
    } else {
      otherMethodContainer.style.display = 'none';
    }
  });
}

// Set current date and auto-populate product details
const selectedProduct = JSON.parse(localStorage.getItem('selectedProduct') || '{}');
const trxId = localStorage.getItem('transactionId') || generateRandomId();

// Auto-populate details
if (selectedProduct) {
  document.getElementById('productName').textContent = selectedProduct.name || 'Panel Pterodactyl';
  document.getElementById('productPrice').textContent = selectedProduct.price || '0';
  document.getElementById('displayTrxId').textContent = trxId;
}

// Set current date
const now = new Date();
const formattedDate = now.toLocaleDateString('id-ID', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
document.getElementById('transactionDate').textContent = formattedDate;
});

// Improved API upload function with better error handling
const api = async (buffer) => {
try {
  // Make sure we're dealing with a proper Blob/File object
  if (!(buffer instanceof Blob) && !(buffer instanceof File)) {
    throw new Error('Invalid upload content: Buffer must be Blob or File');
  }

  const formData = new FormData();
  // Create a proper file object with name and type
  const fileToUpload = new File([buffer], 'payment-proof.png', {
    type: buffer.type || 'image/png'
  });

  formData.append('file', fileToUpload);

  console.log('Uploading file:', fileToUpload.name, 'Size:', fileToUpload.size, 'Type:', fileToUpload.type);

  const response = await fetch('https://i.supa.codes/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Response Error:', response.status, errorText);
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('Upload response:', data);

  // Check if response has the link property
  if (data && data.link) {
    return data.link;
  }
  throw new Error('No valid image URL in API response');
} catch (error) {
  console.error('Upload error:', error);
  throw error;
}
};

// Generate a random transaction ID
function generateRandomId() {
return 'TRX' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().substring(8);
}

// Function to send notification to Telegram
async function submitProofToTelegram() {
const contactInfo = document.getElementById('contactInfo').value;
const paymentMethod = document.getElementById('paymentMethod').value;
const description = document.getElementById('description').value || 'Tidak ada deskripsi';
const proofImageFile = document.getElementById('proofImage').files[0];
const productName = document.getElementById('productName').textContent;
const productPrice = document.getElementById('productPrice').textContent;
const transactionDate = document.getElementById('transactionDate').textContent;
const trxId = document.getElementById('displayTrxId').textContent;

// Get actual payment method (including "Other" option)
let actualPaymentMethod = paymentMethod;
if (paymentMethod === 'Other') {
  const otherMethod = document.getElementById('otherMethod').value;
  if (otherMethod) {
    actualPaymentMethod = otherMethod;
  }
}

// Validate inputs
if (!contactInfo) {
  showUploadStatus('error', 'Mohon masukkan Telegram/WhatsApp Anda');
  return;
}

if (!paymentMethod) {
  showUploadStatus('error', 'Mohon pilih metode pembayaran');
  return;
}

if (paymentMethod === 'Other' && !document.getElementById('otherMethod').value) {
  showUploadStatus('error', 'Mohon sebutkan metode pembayaran Anda');
  return;
}

if (!proofImageFile) {
  showUploadStatus('error', 'Mohon unggah bukti pembayaran');
  return;
}

// Disable button and show loading
const submitBtn = document.getElementById('submitProofBtn');
submitBtn.disabled = true;
submitBtn.textContent = 'Mengirim...';
showUploadStatus('loading', 'Sedang mengunggah bukti transaksi...');

try {
  // First upload the image to get URL
  const imageUrl = await api(proofImageFile);

  if (!imageUrl) {
    throw new Error('Gagal mendapatkan URL gambar');
  }

  // Escape special Markdown characters to prevent parsing errors
  const escapedContactInfo = contactInfo.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
  const escapedActualPaymentMethod = actualPaymentMethod.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
  const escapedProductName = productName.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
  const escapedProductPrice = productPrice.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
  const escapedDescription = description.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');

  // Prepare message for Telegram with escaped text
  const message = 
    `🔔 *BUKTI PEMBAYARAN BARU*\n\n` +
    `👤 *Kontak:* ${escapedContactInfo}\n` +
    `💳 *Metode Pembayaran:* ${escapedActualPaymentMethod}\n` +
    `🛒 *Produk:* ${escapedProductName}\n` +
    `💰 *Harga:* Rp ${escapedProductPrice}\n` +
    `📅 *Tanggal:* ${transactionDate}\n` +
    `🆔 *ID Transaksi:* ${trxId}\n` +
    `📝 *Deskripsi:* ${escapedDescription}\n\n` +
    `📷 *Bukti Pembayaran:* ${imageUrl}`;

  // Send message and image in one go
  const BOT_TOKEN = '7962763033:AAFisNluy4cdf9_P2h7NVG9BZryRfn9Fi48'; // Replace with your bot token
  const CHAT_ID = '6402648265'; // Replace with your admin chat ID

  const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo: imageUrl,
      caption: message,
      parse_mode: 'Markdown'
    })
  });

  const telegramData = await telegramResponse.json();

  if (telegramData.ok) {
    // Show success message
    showUploadStatus('success', 'Bukti transaksi berhasil dikirim! Admin akan segera memproses pesanan Anda.');

    // Disable form after successful submission
    document.getElementById('contactInfo').disabled = true;
    document.getElementById('paymentMethod').disabled = true;
    document.getElementById('description').disabled = true;
    if (document.getElementById('otherMethod')) {
      document.getElementById('otherMethod').disabled = true;
    }
    document.getElementById('proofImage').disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bukti Terkirim ✓';

    // Save to localStorage that proof has been sent
    localStorage.setItem('proofSent', 'true');
  } else {
    throw new Error('Gagal mengirim ke Telegram: ' + (telegramData.description || 'Unknown error'));
  }
} catch (error) {
  console.error('Error sending proof:', error);
  showUploadStatus('error', 'Terjadi kesalahan: ' + error.message);
  submitBtn.disabled = false;
  submitBtn.textContent = 'Coba Lagi';
}
}

// Function to show upload status
function showUploadStatus(type, message) {
const statusDiv = document.getElementById('uploadStatus');
statusDiv.style.display = 'block';

if (type === 'loading') {
  statusDiv.style.backgroundColor = '#1e40af20';
  statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
    <div class="spinner" style="width: 20px; height: 20px;"></div>
    <span>${message}</span>
  </div>`;
} else if (type === 'success') {
  statusDiv.style.backgroundColor = '#06653020';
  statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
    <span style="color: #10b981; font-size: 18px;">✓</span>
    <span>${message}</span>
  </div>`;
} else if (type === 'error') {
  statusDiv.style.backgroundColor = '#9b111120';
  statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
    <span style="color: #ef4444; font-size: 18px;">⚠️</span>
    <span>${message}</span>
  </div>`;
}
}

// Modify existing onPaymentSuccess function to include transaction proof section
function onPaymentSuccess(response) {
// Your existing payment success code

// Save transaction ID for later use
if (response && response.transactionId) {
  localStorage.setItem('transactionId', response.transactionId);
}

// Account info placeholder (replace with actual account generation)
document.getElementById('accountUsername').textContent = 'user_' + Math.random().toString(36).substring(2, 8);
document.getElementById('accountPassword').textContent = 'pass_' + Math.random().toString(36).substring(2, 8);
document.getElementById('panelUrl').textContent = 'https://panel.yourserver.com';

// Show success message with proof upload section
document.getElementById('successMessage').style.display = 'block';

// Hide other sections
document.getElementById('paymentForm').style.display = 'none';
document.getElementById('productSection').style.display = 'none';
document.getElementById('welcomeScreen').style.display = 'none';
}

//==== ( Funcation ToggLemenu ) ====//
function toggleMenu() {
  var menu = document.getElementById('sideMenu');
  menu.classList.toggle('active');
}