const qr = require('qrcode-terminal');
const axios = require('axios');

let lastStatus = '';
let allCookies = '';

axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

async function generateQrCode() {
  try {
    const response = await axios.get('https://shopee.co.id/api/v2/authentication/gen_qrcode');

    if (response.status === 200) {
      const QrCodeId = response.data.data.qrcode_id;
      const data = `https://shopee.co.id/universal-link/qrcode-login?id=${QrCodeId}`;

      qr.generate(data, { small: true });

      while (true) {
        try {
          const statusResponse = await axios.get(`https://shopee.co.id/api/v2/authentication/qrcode_status?qrcode_id=${QrCodeId}`);
          const statusData = statusResponse.data.data;
          const currentStatus = statusResponse.data.data.status;

          if (currentStatus !== lastStatus) {
            console.log(`QR Status : ${currentStatus}`);
            lastStatus = currentStatus;
          }

          if (currentStatus === 'CONFIRMED') {
            const qrcodeToken = statusData.qrcode_token;
            const postData = {
              qrcode_token: qrcodeToken,
              device_sz_fingerprint: 'OazXiPqlUgm158nr1h09yA==|0/eMoV7m/rlUHbgxsRgRC/n0vyOe6XzhDMa2PcnZPv3ecioRaJQg2W7ur5GfhoDDEeuMz2az7GGj/8Y=|Pu2hbrwoH+45rDNC|08|3',
              client_identifier: {
                security_device_fingerprint: 'OazXiPqlUgm158nr1h09yA==|0/eMoV7m/rlUHbgxsRgRC/n0vyOe6XzhDMa2PcnZPv3ecioRaJQg2W7ur5GfhoDDEeuMz2az7GGj/8Y=|Pu2hbrwoH+45rDNC|08|3',
              },
            };
            const loginResponse = await axios.post('https://shopee.co.id/api/v2/authentication/qrcode_login', postData);

            if (loginResponse.headers['set-cookie']) {
              const cookies = loginResponse.headers['set-cookie'];
              console.log();
              allCookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
              console.log(allCookies);
            }
            break;
          }

          if (currentStatus === 'CANCELED') {
            break;
          }

          if (currentStatus === 'EXPIRED') {
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000)); 
        } catch (error) {
          console.error('Error checking QR code status:', error.message);
          console.log('Retrying from the beginning...');
          await new Promise(resolve => setTimeout(resolve, 5000)); 
          return generateQrCode();
        }
      }
    } else {
      console.error('Failed to get QR code data');
    }
  } catch (error) {
    console.error('Error fetching QR code:', error.message);
  }
}

generateQrCode();
