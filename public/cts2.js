//~~~~~~~~~~~~~~~~~~~~~ { Settings } ~~~~~~~~~~~~~~~~~~~~~~//
const settings = {
  apiSimpel: 'new2025', // Your API key for payment processing
  ptla_api: 'ptla_dh7us9Eiknof6CDSZqk6CWoS73qUcdCNDI7VYNLUfdn', // Pterodactyl API key isi Di Line 173
  domain: 'https://lubyzprivat.tamapriv.my.id',
  domainkey: 'https://lubyzprivat.tamapriv.my.id', // Pterodactyl panel URL
  MERCHANT_ID: 'OK1998313',
  KEYORKUT: '836870117503314611998313OKCTD9535ACD907E3577A9B9BDFA2915551C',
  SIMPELZ_API: 'https://simpelz.fahriofficial.my.id/api/orkut', // Simpelz API base URL
  QR_CODE_URL: '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214054490719799990303UMI51440014ID.CO.QRIS.WWW0215ID20243394995900303UMI5204541153033605802ID5921RIZAL STORE OK19983136010TANAH LAUT61057081262070703A0163047FE8', // QR code generator URL
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

function backToWelcome() {
  debugLog("Going back to welcome screen");
  document.getElementById("welcomeScreen").style.display = "flex";
  document.getElementById("productSection").style.display = "none";
  document.getElementById("paymentForm").style.display = "none";
  document.getElementById("successMessage").style.display = "none";

  // Clear the success message flag in session storage
  const successDataStr = sessionStorage.getItem('successData');
  if (successDataStr) {
    const successData = JSON.parse(successDataStr);
    successData.showSuccessMessage = false;
    sessionStorage.setItem('successData', JSON.stringify(successData));
  }

  history.pushState({}, '', window.location.pathname);
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
saveSuccessDataToSession(
  username,
  password,
  panelUrl
);
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
async function createPterodactylAccount(email, product) {
  // Correct API URL from your example
  const url = 'https://simpelz.fahriofficial.my.id/api/pterodactyl/create-user-and-server';
  const domain = 'https://lubyzprivat.tamapriv.my.id';
  const apikey = 'ptla_dh7us9Eiknof6CDSZqk6CWoS73qUcdCNDI7VYNLUfdn';

  // Generate username based on email
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const firstName = username.charAt(0).toUpperCase() + username.slice(1);
  const lastName = "Test";

  // Konfigurasi berdasarkan produk
  let memory = 1024, diskSize = 1024, cpuCores = 30;
  if (product === 'premium') {
    memory = 2048;
    diskSize = 2048;
    cpuCores = 50;
  } else if (product === 'business') {
    memory = 4120;
    diskSize = 4120;
    cpuCores = 70;
  } else if (product === 'paketmod') {  
    memory = 3024;
    diskSize = 3024;
    cpuCores = 60;
  } else if (product === 'pakethost') {
    memory = 5024;
    diskSize = 5024;
    cpuCores = 80;
  } else if (product === 'pakethost1') {
    memory = 6024;
    diskSize = 6024;
    cpuCores = 100;
  } else if (product === 'pakethost2') {
    memory = 7024;
    diskSize = 7024;
    cpuCores = 120;
  } else if (product === 'pakethost3') {
    memory = 8024;
    diskSize = 8024;
    cpuCores = 150;
  } else if (product === 'pakethost4') {
    memory = 9024;
    diskSize = 9024;
    cpuCores = 170;
  } else if (product === 'pakethost5') {
    memory = 0;
    diskSize = 0;
    cpuCores = 0;
  }


  // Generate password acak
  const password = username + Math.random().toString(36).substring(2, 8);

  try {
    // Using query parameters as shown in your working example
    const params = new URLSearchParams({
      domain: domain,
      apikey: apikey,
      email: email,
      username: username,
      first_name: firstName,
      last_name: lastName,
      memory: memory,
      disk: diskSize,
      cpu: cpuCores,
      locV2: 1,
      password: password
    });

    const requestUrl = `${url}?${params.toString()}`;
    console.log("Sending request to create Pterodactyl account:", requestUrl);

    const response = await fetch(requestUrl, {
      method: 'GET', // Changed to GET as the example uses query parameters
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned error status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Pterodactyl API response:", data);

    if (!data.success) {
      throw new Error("API returned success: false - " + (data.message || "Unknown error"));
    }

    // Updated to match the actual response format shown in your example
    if (!data.user) {
      throw new Error("API response missing user data");
    }

    return {
      success: true,
      account: {
        id: data.user.id,
        uuid: data.user.uuid || "unknown",
        username: data.user.username || username,
        password: password,
        panelUrl: domain,
        server: data.server ? {
          id: data.server.id,
          uuid: data.server.uuid,
          identifier: data.server.identifier,
          name: data.server.name,
          status: data.server.status
        } : null
      }
    };
  } catch (error) {
    console.error("Failed to create account:", error);

    return {
      success: false,
      error: error.message || "Unknown error",
      account: null
    };
  }
}

// Kode QR default
const kodeQrDefault = settings.QR_CODE_URL;
// Add this to the top of your JavaScript file, with other global variables
let paymentSession = {
  active: false,
  email: '',
  product: '',
  price: 0,
  transactionId: '',
  amount: 0,
  qrImageUrl: '',
  idPembayaran: ''
};

// Modified startPayment function to save session data
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
    const minFee = 100;  // minimal fee
    const maxFee = 500;  // maksimal fee
    const randomFee = Math.floor(Math.random() * (maxFee - minFee + 1)) + minFee;
    const totalAmount = Number(selectedPrice) + randomFee;

    debugLog(`Base price: ${selectedPrice}, Random fee: ${randomFee}, Total amount: ${totalAmount}`);

    const qrFinal = injectAmountToQrString(kodeQrDefault, totalAmount);
    const encodedQR = encodeURIComponent(qrFinal);
    const apiKey = settings.apiSimpel;
    const createUrl = `https://simpelz.fahriofficial.my.id/api/orkut/createpayment?apikey=${apiKey}&amount=${totalAmount}&codeqr=${kodeQrDefault}`;

    debugLog(`Calling API: ${createUrl}`);

    let data;
    if (DEBUG_MODE) {
      // Simulate API response
      debugLog("DEBUG MODE: Simulating API response");
      data = {
        status: true,
        result: {
          transactionId: "TX" + Date.now(),
          amount: totalAmount,
          qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodedQR
        }
      };
    } else {
      const res = await fetch(createUrl);
      data = await res.json();
    }

    debugLog("API Response: " + JSON.stringify(data));

    document.getElementById("loading").style.display = "none";

    if (data.status) {
      // Save session data
      paymentSession = {
        active: true,
        email: email,
        product: selectedProduct,
        price: selectedPrice,
        transactionId: data.result.transactionId,
        amount: data.result.amount,
        qrImageUrl: data.result.qrImageUrl,
        idPembayaran: idPembayaran,
        startTime: Date.now()
      };

      // Save to sessionStorage
      sessionStorage.setItem('paymentSession', JSON.stringify(paymentSession));

      // Also update URL to include session ID (helps with browser history)
      history.pushState({paymentId: idPembayaran}, '', `?payment=${idPembayaran}`);

      currentQrUrl = data.result.qrImageUrl;
      document.getElementById("info").style.display = "block";
      document.getElementById("status").style.display = "block";
      document.getElementById("idPembayaran").innerText = idPembayaran;
      document.getElementById("trxId").innerText = data.result.transactionId;
      document.getElementById("total").innerText = data.result.amount;
      document.getElementById("expired").innerText = "10 Menit dari sekarang";
      document.getElementById("qrImageUrl").innerText = data.result.qrImageUrl;
      document.getElementById("qrImage").src = data.result.qrImageUrl;
      // Sembunyikan tombol Bayar, tampilkan tombol Cancel
      document.getElementById("startButton").style.display = "none";
      document.getElementById("cancelButton").style.display = "block";
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

// Updated startPolling function to handle account creation failure better
function startPolling(targetAmount, transactionId, email) {
  debugLog(`Starting payment status polling for amount: ${targetAmount}, txID: ${transactionId}`);
  const apiKey = settings.apiSimpel;
  const keyorkut = settings.KEYORKUT;
  const merchant = settings.MERCHANT_ID;
  const statusDiv = document.getElementById("status");

  statusDiv.innerText = "⏳ Menunggu pembayaran...";
  statusDiv.className = "";
  statusDiv.style.display = "block";

  if (polling) {
    clearInterval(polling);
    debugLog("Cleared previous polling interval");
  }

  polling = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    debugLog(`Polling payment status, elapsed time: ${Math.floor(elapsed / 1000)}s`);

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
        data = await res.json();
      }

      debugLog("Status polling result: " + JSON.stringify(data));

      // Check payment status - use approximately equal for floating point safety
      if (data && data.type === "CR" && Math.abs(Number(data.amount) - Number(targetAmount)) < 0.01) {
        clearInterval(polling);
        statusDiv.innerText = "✅ Pembayaran Berhasil!";
        statusDiv.className = "success";
        debugLog("Payment successful!");

        // Create Pterodactyl account
        statusDiv.innerText = "⏳ Pembayaran Berhasil! Membuat akun...";
        const accountResult = await createPterodactylAccount(email, selectedProduct);          if (accountResult.success && accountResult.account) {
          if (accountResult.success && accountResult.account) {
              debugLog(`Account created successfully: ${JSON.stringify(accountResult.account)}`);

          // Show success message with account details
          setTimeout(() => {
            document.getElementById("paymentForm").style.display = "none";
            document.getElementById("successMessage").style.display = "block";

            // Update account info
            document.getElementById("accountUsername").innerText = accountResult.account.username;
            document.getElementById("accountPassword").innerText = accountResult.account.password;
            document.getElementById("panelUrl").innerText = accountResult.account.panelUrl;
 // Add this line to save the success data
 saveSuccessDataToSession(
  accountResult.account.username,
  accountResult.account.password,
  accountResult.account.panelUrl
);
            statusDiv.innerText = "✅ Akun berhasil dibuat!";
          }, 1500);
      }
        } else {
          debugLog("Failed to create account: " + (accountResult.error || "Unknown error"));
          statusDiv.innerText = "⚠️ Pembayaran berhasil, tapi gagal membuat akun";
          alert("Pembayaran diterima tetapi gagal membuat akun: " + (accountResult.error || "Silakan hubungi admin."));
        }
      }

    } catch (err) {
      debugLog("Polling error: " + err);
    }
  }, 3000);
}

// Also update the checkStatusNow function to use similar error handling logic
async function checkStatusNow() {
  debugLog("Manual status check initiated");
  const apiKey = settings.apiSimpel;
  const keyorkut = settings.KEYORKUT;
  const merchant = settings.MERCHANT_ID;
  const statusDiv = document.getElementById("status");
  const transactionId = document.getElementById("trxId").innerText;
  const email = document.getElementById("email").value;
  const targetAmount = Number(document.getElementById("total").innerText);

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
          amount: targetAmount
        };
      } else {
        data = { type: "WAITING" };
        debugLog("DEBUG MODE: Simulating payment not found on manual check");
      }
    } else {
      const res = await fetch(`https://simpelz.fahriofficial.my.id/api/orkut/cekstatus?apikey=${apiKey}&merchant=${merchant}&keyorkut=${keyorkut}`);
      data = await res.json();
    }

    debugLog("Manual check result: " + JSON.stringify(data));

    // Use approximately equal for floating point safety
    if (data && data.type === "CR" && Math.abs(Number(data.amount) - targetAmount) < 0.01) {
      clearInterval(polling);
      statusDiv.innerText = "✅ Pembayaran Berhasil (Cek Manual)!";
      statusDiv.className = "success";
      debugLog("Manual check confirmed successful payment");

      // Create Pterodactyl account
      statusDiv.innerText = "⏳ Pembayaran Berhasil! Membuat akun...";
      const accountResult = await createPterodactylAccount(email, selectedProduct);

      if (accountResult.success && accountResult.account) {
        debugLog(`Account created successfully: ${JSON.stringify(accountResult.account)}`);

        // Show success message with account details
        setTimeout(() => {
          document.getElementById("paymentForm").style.display = "none";
          document.getElementById("successMessage").style.display = "block";

          // Update account info
          document.getElementById("accountUsername").innerText = accountResult.account.username;
          document.getElementById("accountPassword").innerText = accountResult.account.password;
          document.getElementById("panelUrl").innerText = accountResult.account.panelUrl;
        saveSuccessDataToSession(
        accountResult.account.username,
        accountResult.account.password,
        accountResult.account.panelUrl
    );
          statusDiv.innerText = "✅ Akun berhasil dibuat!";
        }, 1500);
      } else {
        debugLog("Failed to create account: " + (accountResult.error || "Unknown error"));
        statusDiv.innerText = "⚠️ Pembayaran berhasil, tapi gagal membuat akun";
        alert("Pembayaran diterima tetapi gagal membuat akun: " + (accountResult.error || "Silakan hubungi admin."));
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

//~~~ Func Buka / Tutup 
function toggleRules() {
  const content = document.getElementById("rulesContent");
  const icon = document.getElementById("rulesToggleIcon");
  content.classList.toggle("open");
  icon.innerText = content.classList.contains("open") ? "▲" : "▼";
}
// Fixed file to buffer conversion
function fileToBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      // Create a proper Blob with the file data and original type
      const blob = new Blob([reader.result], {type: file.type});
      resolve(blob);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

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

// Function to submit payment proof and send Telegram notification
async function submitPaymentProof() {
  // Get form data
  const fileInput = document.getElementById('proofUpload');
  const senderName = document.getElementById('senderName').value;
  const senderBank = document.getElementById('senderBank').value;
  const transferNotes = document.getElementById('transferNotes').value;

  // Get package details - handle potential missing elements
  let packageName = "Package";
  let price = "Price";

  const summaryPackage = document.getElementById('summaryPackage');
  if (summaryPackage) packageName = summaryPackage.textContent;

  const summaryPrice = document.getElementById('summaryPrice');
  if (summaryPrice) price = summaryPrice.textContent;

  // Validation
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showUploadStatus('Silakan upload bukti pembayaran terlebih dahulu', 'error');
    return;
  }

  if (!senderName.trim()) {
    showUploadStatus('Nama pengirim tidak boleh kosong', 'error');
    return;
  }

  if (!senderBank.trim()) {
    showUploadStatus('Bank/Metode pembayaran tidak boleh kosong', 'error');
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById('submitProofBtn');
  if (!submitBtn) {
    showUploadStatus('Error: Button not found', 'error');
    return;
  }

  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg> Mengirim...';
  submitBtn.disabled = true;

  try {
    console.log('Starting payment proof submission process');

    // Upload image file to SupaCodes
    const imageFile = fileInput.files[0];
    console.log('File selected:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);

    // Check file size early to prevent large uploads
    if (imageFile.size > 5 * 1024 * 1024) {
      showUploadStatus('Ukuran file terlalu besar! Maksimal 5MB', 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    const imageBuffer = await fileToBuffer(imageFile);
    console.log('File converted to buffer successfully');

    // Upload and get URL
    console.log('Starting upload to SupaCodes...');
    const imageUrl = await uploadToSupaCodes(imageBuffer);
    console.log('Upload successful, URL:', imageUrl);

    // Keep a local preview with base64 for display
    const imageBase64 = await fileToBase64(imageFile);

    // Generate payment ID
    const paymentId = 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Create payment data object
    const paymentData = {
      id: paymentId,
      packageName: packageName,
      price: price,
      senderName: senderName,
      senderBank: senderBank,
      transferNotes: transferNotes,
      timestamp: new Date().toLocaleString('id-ID'),
      imageUrl: imageUrl,
      imageBase64: imageBase64 // Keep for preview purposes
    };

    // Store in localStorage for demonstration (excluding base64 to save space)
    const storageData = {...paymentData};
    delete storageData.imageBase64;
    savePaymentToLocalStorage(storageData);

    // Send Telegram notification
    console.log('Sending telegram notification...');
    await sendTelegramNotification(paymentData);

    // Show success message
    showUploadStatus('Bukti pembayaran berhasil dikirim! Tim kami akan segera memproses pembayaran Anda.', 'success');

    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;

    // Show pending section
    const manualPayment = document.querySelector('.manual-payment-section');
    if (manualPayment) {
      manualPayment.innerHTML = `
        <div class="payment-pending">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Bukti Pembayaran Terkirim!</h3>
          <p>Tim kami akan segera memproses pembayaran Anda segera setelah pembayaran diverifikasi.</p>
          <p class="pending-note">Biasanya proses verifikasi membutuhkan waktu 10-30 menit pada jam kerja (08.00 - 21.00 WIB).</p>
          <p class="image-url"><a href="${imageUrl}" target="_blank">Lihat bukti pembayaran</a></p>
        </div>
      `;
    }

  } catch (error) {
    console.error('Error submitting payment:', error);
    showUploadStatus('Terjadi kesalahan saat upload gambar: ' + error.message, 'error');
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
}

// Helper function for uploading to SupaCodes - with better error handling
async function uploadToSupaCodes(buffer) {
  try {
    const imageUrl = await api(buffer);
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      throw new Error('Invalid URL response from upload API');
    }
    return imageUrl;
  } catch (error) {
    console.error('Upload to SupaCodes failed:', error.message);
    throw error;
  }
}

// Function to store payment in localStorage (for demonstration)
function savePaymentToLocalStorage(paymentData) {
  try {
    // Get existing payments or create empty array
    const existingPayments = JSON.parse(localStorage.getItem('pendingPayments')) || [];

    // Add new payment
    existingPayments.push(paymentData);

    // Save to localStorage
    localStorage.setItem('pendingPayments', JSON.stringify(existingPayments));
    console.log('Payment data saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Define TELEGRAM_CONFIG
const TELEGRAM_CONFIG = {
  botToken: "7962763033:AAFisNluy4cdf9_P2h7NVG9BZryRfn9Fi48",
  chatId: "6402648265"
};

// Improved function to send notification to Telegram bot
async function sendTelegramNotification(paymentData) {
  try {
    // Format the message for Telegram including the image URL
    const message = `
🔔 *NOTIFIKASI PEMBAYARAN BARU!*

🆔 *ID Pembayaran:* ${paymentData.id}
📦 *Paket:* ${paymentData.packageName}
💰 *Harga:* ${paymentData.price}

💳 *Informasi Pembayaran:*
👤 Pengirim: ${paymentData.senderName}
🏦 Bank/Metode: ${paymentData.senderBank}
${paymentData.transferNotes ? `📝 Catatan: ${paymentData.transferNotes}` : ''}

🖼️ *Bukti Pembayaran:* ${paymentData.imageUrl}

⏰ *Waktu:* ${paymentData.timestamp}
`;

    // Using sendPhoto method with the URL instead of file upload
    const photoUrl = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.botToken + '/sendPhoto';

    const payload = {
      chat_id: TELEGRAM_CONFIG.chatId,
      photo: paymentData.imageUrl,
      caption: message,
      parse_mode: 'Markdown'
    };

    console.log('Sending Telegram photo message...');

    // Send the request to Telegram API
    const response = await fetch(photoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Telegram API response:', data);

    if (!data.ok) {
      throw new Error('Failed to send Telegram notification: ' + (data.description || 'Unknown error'));
    }

    console.log('Telegram notification sent successfully!');
    return true;

  } catch (error) {
    console.error('Error sending Telegram notification with photo:', error);

    // If sending photo fails, try sending just text message as fallback
    try {
      console.log('Attempting fallback text-only Telegram message...');
      const messageUrl = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.botToken + '/sendMessage';

      const response = await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.chatId,
          text: message + '\n\n⚠️ *Tautan bukti pembayaran tidak dapat dikirim sebagai foto*',
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      const data = await response.json();
      console.log('Telegram fallback response:', data);

      if (!data.ok) throw new Error('Fallback message failed: ' + (data.description || 'Unknown error'));

      return true;
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
      return false;
    }
  }
}

// Function to display upload status messages
function showUploadStatus(message, type) {
  const statusElement = document.getElementById('uploadStatus');
  if (!statusElement) {
    console.error('Error: Upload status element not found');
    return;
  }

  statusElement.innerHTML = message;
  statusElement.className = 'upload-status ' + type;
  statusElement.style.display = 'block';

  // Auto hide after 5 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 5000);
}

// Improved function to handle file selection
function handleFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    handleFiles(files);
  }
}

// Improved function to handle files
function handleFiles(files) {
  const file = files[0]; // Just handle the first file

  if (!file) {
    showUploadStatus('Error: Tidak ada file yang dipilih', 'error');
    return;
  }

  if (!file.type.match('image.*')) {
    showUploadStatus('Hanya file gambar yang diperbolehkan (.jpg, .png, .jpeg)', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB max
    showUploadStatus('Ukuran file terlalu besar! Maksimal 5MB', 'error');
    return;
  }

  displayPreview(file);
}

// Function to display image preview
function displayPreview(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const previewImage = document.getElementById('previewImage');
    const previewArea = document.getElementById('previewArea');
    const uploadArea = document.getElementById('uploadArea');

    if (previewImage) previewImage.src = e.target.result;
    if (previewArea) previewArea.style.display = 'block';
    if (uploadArea) uploadArea.style.display = 'none';
  }

  reader.readAsDataURL(file);
}

// Function to remove image preview
function removePreview() {
  const previewArea = document.getElementById('previewArea');
  const uploadArea = document.getElementById('uploadArea');
  const proofUpload = document.getElementById('proofUpload');

  if (previewArea) previewArea.style.display = 'none';
  if (uploadArea) uploadArea.style.display = 'block';
  if (proofUpload) proofUpload.value = '';
}

// Function to handle upload area highlight
function highlight() {
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) {
    uploadArea.style.borderColor = '#6d28d9';
    uploadArea.style.backgroundColor = 'rgba(124, 58, 237, 0.15)';
  }
}

// Function to handle upload area unhighlight
function unhighlight() {
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) {
    uploadArea.style.borderColor = '#7c3aed';
    uploadArea.style.backgroundColor = 'rgba(124, 58, 237, 0.05)';
  }
}

// Function to prevent default drag behaviors
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Function to handle dropped files
function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    handleFiles(files);
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

  // Clear payment session
  paymentSession.active = false;
  sessionStorage.removeItem('paymentSession');

  // Reset URL
  history.pushState({}, '', window.location.pathname);
}

// Add this function to check and restore session on page load
function checkPaymentSession() {
  const sessionData = sessionStorage.getItem('paymentSession');

  if (sessionData) {
    try {
      paymentSession = JSON.parse(sessionData);

      if (paymentSession.active) {
        // Check if session has expired (10 minutes)
        const currentTime = Date.now();
        const elapsedTime = currentTime - paymentSession.startTime;

        if (elapsedTime > 600000) {
          // Session expired, clear it
          debugLog("Payment session expired, clearing");
          sessionStorage.removeItem('paymentSession');
          return;
        }

        debugLog("Restoring payment session: " + JSON.stringify(paymentSession));

        // Restore UI to payment state
        selectedProduct = paymentSession.product;
        selectedPrice = paymentSession.price;

        // Skip welcome & product screens
        document.getElementById("welcomeScreen").style.display = "none";
        document.getElementById("productSection").style.display = "none";
        document.getElementById("paymentForm").style.display = "block";
        document.getElementById("successMessage").style.display = "none";

        // Restore QR and payment info
        document.getElementById("email").value = paymentSession.email;
        document.getElementById("info").style.display = "block";
        document.getElementById("status").style.display = "block";
        document.getElementById("idPembayaran").innerText = paymentSession.idPembayaran;
        document.getElementById("trxId").innerText = paymentSession.transactionId;
        document.getElementById("total").innerText = paymentSession.amount;

        // Calculate remaining time
        const timeElapsed = Math.floor(elapsedTime / 1000);
        const timeRemaining = Math.max(0, 600 - timeElapsed);
        const minutesRemaining = Math.floor(timeRemaining / 60);
        const secondsRemaining = timeRemaining % 60;
        document.getElementById("expired").innerText = `${minutesRemaining} Menit ${secondsRemaining} Detik tersisa`;

        document.getElementById("qrImageUrl").innerText = paymentSession.qrImageUrl;
        document.getElementById("qrImage").src = paymentSession.qrImageUrl;
        currentQrUrl = paymentSession.qrImageUrl;

        // Show cancel button, hide start button
        document.getElementById("startButton").style.display = "none";
        document.getElementById("cancelButton").style.display = "block";

        // Update URL
        history.replaceState({paymentId: paymentSession.idPembayaran}, '', `?payment=${paymentSession.idPembayaran}`);

        // Restart polling (with remaining time from session)
        startTime = paymentSession.startTime;
        startPolling(paymentSession.amount, paymentSession.transactionId, paymentSession.email);
      }
    } catch (error) {
      debugLog("Error restoring payment session: " + error);
      sessionStorage.removeItem('paymentSession');
    }
  }
}
function saveSuccessDataToSession(username, password, panelUrl) {
  const successData = {
    accountUsername: username,
    accountPassword: password,
    panelUrl: panelUrl,
    showSuccessMessage: true
  };

  // Save to sessionStorage
  sessionStorage.setItem('successData', JSON.stringify(successData));
  console.log("Success data saved to session storage");
}
// Function to check if success data exists in session and restore it
function checkSuccessSession() {
  const successData = sessionStorage.getItem('successData');

  if (successData) {
    try {
      const data = JSON.parse(successData);
          // Clear payment session


      if (data.showSuccessMessage) {
        console.log("Restoring success data from session");

        // Hide other sections
        document.getElementById("welcomeScreen").style.display = "none";
        document.getElementById("productSection").style.display = "none";
        document.getElementById("paymentForm").style.display = "none";

        // Show success message
        document.getElementById("successMessage").style.display = "block";

        // Restore account details
        document.getElementById("accountUsername").innerText = data.accountUsername;
        document.getElementById("accountPassword").innerText = data.accountPassword;
        document.getElementById("panelUrl").innerText = data.panelUrl;
      }
    } catch (error) {
      console.error("Error restoring success session:", error);
      sessionStorage.removeItem('successData');
    }
  }
}
// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, initializing upload functionality...');

  // Add event listener for file input
  const proofUpload = document.getElementById('proofUpload');
  if (proofUpload) {
    proofUpload.addEventListener('change', handleFileSelect);
    console.log('File input listener initialized');
  }

  // Add event listener for submit button
  const submitProofBtn = document.getElementById('submitProofBtn');
  if (submitProofBtn) {
    submitProofBtn.addEventListener('click', submitPaymentProof);
    console.log('Submit button listener initialized');
  }

  // Initialize drag and drop functionality
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    // Handle click to select file
    uploadArea.addEventListener('click', function() {
      document.getElementById('proofUpload').click();
    });

    console.log('Drag and drop listeners initialized');
  }

  console.log('All upload functionality initialized successfully');
  checkPaymentSession();
  checkSuccessSession();
});