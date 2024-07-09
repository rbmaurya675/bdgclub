import connection from "../config/connectDB";
import winGoController from "./winGoController";
import k5Controller from "./k5Controller";
import k3Controller from "./k3Controller";
import cron from 'node-cron';
const axios = require('axios');
// const cron = require('node-cron');
// const mysql = require('mysql');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cronJobGame1p = (io) => {
    cron.schedule('*/1 * * * *', async () => {
        await winGoController.addWinGo(1);
        await winGoController.handlingWinGo1P(1);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // Cầu mới chưa có kết quả
        io.emit('data-server', { data: data });

        await k5Controller.add5D(1);
        await k5Controller.handling5D(1);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // Cầu mới chưa có kết quả
        io.emit('data-server-5d', { data: data2, 'game': '1' });

        await k3Controller.addK3(1);
        await k3Controller.handlingK3(1);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // Cầu mới chưa có kết quả
        io.emit('data-server-k3', { data: data3, 'game': '1' });
    });
    cron.schedule('*/3 * * * *', async () => {
        await winGoController.addWinGo(3);
        await winGoController.handlingWinGo1P(3);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo3" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // Cầu mới chưa có kết quả
        io.emit('data-server', { data: data });

        await k5Controller.add5D(3);
        await k5Controller.handling5D(3);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // Cầu mới chưa có kết quả
        io.emit('data-server-5d', { data: data2, 'game': '3' });

        await k3Controller.addK3(3);
        await k3Controller.handlingK3(3);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // Cầu mới chưa có kết quả
        io.emit('data-server-k3', { data: data3, 'game': '3' });
    });
    const fetchLatestBlock = async (type, value) => {
        console.log("Entering fetchLatestBlock function...");
        console.log("value is....", value)
        try {
            const fetchDataQuery = `SELECT block+${value} as block FROM trx WHERE type=${type} ORDER BY block DESC LIMIT 1`;
            // Execute query using await
            const [rows, fields] = await connection.execute(fetchDataQuery);
            if (rows.length > 0) {
                const latestBlock = rows[0].block;
                // console.log("Latest block fetched:", latestBlock);
                return latestBlock;
            } else {
                console.log("No blocks found in trx table.");
                return null;
            }
        } catch (error) {
            console.error('Error fetching latest block:', error);
            throw error;
        }
    };
    fetchLatestBlock()
        .then(latestBlock => {
            // console.log("Latest block:", latestBlock);
        })
        .catch(error => {
            console.error("Error:", error);
        });

// Function to generate a unique ID with 17 characters
function generateUniqueID() {
    const now = new Date();
    const year = now.getFullYear().toString(); // Last two digits of the year
    const month = ('0' + (now.getMonth() + 1)).slice(-2); // Month (zero padded)
    const date = ('0' + now.getDate()).slice(-2); // Date (zero padded)
    const hours = ('0' + now.getHours()).slice(-2); // Hours (zero padded)
    const minutes = ('0' + now.getMinutes()).slice(-2); // Minutes (zero padded)
    // const seconds = ('0' + now.getSeconds()).slice(-2); // Seconds (zero padded)
   

    // Increment sequential number and wrap around if it exceeds 9
    // const seconds = minutes + 1;

    // Concatenate parts to form the unique ID
    const uniqueID = `${year}${month}${date}${hours}${minutes}`;

    return uniqueID;
}

    cron.schedule('*/1 * * * *', async () => {
        try {
            const [trxgetData] = await connection.execute('SELECT * FROM trx WHERE type = 1 ORDER BY id DESC LIMIT 10', []);
            const trxdata = trxgetData.map(item => {
                // Update hash to show only the last 6 characters
                item.hash = item.hash.slice(-4);
              
                // Update time to show only the time part (HH:mm:ss)
                item.time = item.time.split(' ')[1];
              
                // Format period field as per your requirement
                const formattedPeriod = `202**${item.period.toString().slice(-4)}`;
                item.period = formattedPeriod;
              
                // Return the modified item
                return item;
              });
            // console.log("trxdata...", trxdata)
            io.emit('data-server-trx', { data: trxdata });
            const [trxgetperiod] = await connection.execute('SELECT * FROM trx WHERE type = 1 ORDER BY id DESC LIMIT 1', []);
            // console.log("trxgetperiod...",trxgetperiod[0].period);
            const trxPeriodData=trxgetperiod[0].period +1;
            // console.log("trx period data with + 1 value ....",trxPeriodData)
            io.emit('data-server-trx-get-period', { data: trxPeriodData });
            await sleep(56000);
            const latestBlock = await fetchLatestBlock(1, 20);
            // console.log("Latest block DATA IS ..:", latestBlock);
            
            // console.log(".................");

            const response = await axios.get('https://codunia.com/trx.php', {
                params: {
                    blockNumber: latestBlock
                }
            });
            // Log the entire API response to debug the structure
            // console.log('API Response:', response.data);
            const data = response.data;
            // Extract required fields from the API response
            const block = data.BlockHeight;
            const hash = data.Hash;
            const result = data.result;
            // const time = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp
            // Get the current local time in the desired format
 // Get the current local time, subtract 3 seconds, and create a new Date object
 const currentTime = new Date();
 const adjustedTime = new Date(currentTime.getTime() - 3000);

 // Get the local time in the desired format
 const time = adjustedTime.toLocaleString('en-GB', {
     year: 'numeric',
     month: '2-digit',
     day: '2-digit',
     hour: '2-digit',
     minute: '2-digit',
     second: '2-digit'
 }).replace(',', '');

 // Format the time string to match "YYYY-MM-DD HH:MM:SS"
 const formattedTime = time.replace(/(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1 $4:$5:$6');
            console.log("time is ....",formattedTime)
            const bigsmall = result <= 4 ? 'small' : 'big';
            const status = 1;
            const singleType = 1;
            // SQL query to insert data
            const uniqueID = generateUniqueID();
            // console.log("uniqueId .....",uniqueID)
            const query = 'INSERT INTO trx (period, block, hash, result, bigsmall, time, status,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [uniqueID, block, hash, result, bigsmall, formattedTime, status, singleType]; // Assuming period can be null or auto-increment
            // Execute the query and handle potential errors
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return;
                }
                console.log('Data inserted:', results.insertId);
            });
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    });
    ////////
    const fetchAndEmitData = async () => {
        try {
            console.log("Running task every 3 seconds...");
            const [trxgetData] = await connection.execute('SELECT * FROM trx  ORDER BY id DESC LIMIT 5', []);
            const trxdata = trxgetData.map(item => {
                item.hash = item.hash.slice(-4);
                item.time = item.time.split(' ')[1];
                return item;
            });
            console.log("trxdata is given..",trxdata)
            io.emit('data-server-trx-three-secound', { data: trxdata });
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    };
    setInterval(fetchAndEmitData, 3000);
    // cron.schedule('3 * * * *', async () => {
    //     try {
    //         console.log("run data every 3 secound...")
    //         const [trxgetData] = await connection.execute('SELECT * FROM trx WHERE type = 1 ORDER BY id DESC LIMIT 10', []);
    //         const trxdata = trxgetData.map(item => {
    //             item.hash = item.hash.slice(-4);
    //             item.time = item.time.split(' ')[1];
    //             return item;
    //           });
    //         // console.log("trxdata...", trxdata)
    //         io.emit('data-server-trx', { data: trxdata });
    //     } catch (error) {
    //         console.error('Error fetching data from API:', error);
    //     }
    // });
    cron.schedule('*/3 * * * *', async () => {
        try {
            const [trxgetData] = await connection.execute('SELECT * FROM trx WHERE type = 2 ORDER BY id DESC LIMIT 10', []);
            const trxdataThreeMinute = trxgetData.map(item => {
                // Update hash to show only the last 6 characters
                item.hash = item.hash.slice(-4);
              
                // Update time to show only the time part (HH:mm:ss)
                item.time = item.time.split(' ')[1];
              
                // Format period field as per your requirement
                const formattedPeriod = `202**${item.period.toString().slice(-4)}`;
                item.period = formattedPeriod;
              
                // Return the modified item
                return item;
              });
            io.emit('data-server-trxThreeMinute', { data: trxdataThreeMinute });
            const [trxgetperiod] = await connection.execute('SELECT * FROM trx WHERE type = 2 ORDER BY id DESC LIMIT 1', []);
            const trxPeriodData=trxgetperiod[0].period +1;
            // console.log("trx period data with + 1 value ....",trxPeriodData)
            io.emit('data-server-trxThreeMinute-get-period', { data: trxPeriodData });
            await sleep(56000);
            const latestBlock = await fetchLatestBlock(2, 60);
            // console.log("Latest block DATA IS ..:", latestBlock);
            
            console.log(".................");

            const response = await axios.get('https://codunia.com/trx.php', {
                params: {
                    blockNumber: latestBlock
                }
            });
            const data = response.data;
            // Extract required fields from the API response
            const block = data.BlockHeight;
            const hash = data.Hash;
            const result = data.result;
            const time = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp
            const bigsmall = result <= 4 ? 'small' : 'big';
            const status = 1;
            const singleType = 2;
            // SQL query to insert data
            const uniqueID = generateUniqueID();
            const query = 'INSERT INTO trx (period, block, hash, result, bigsmall, time, status,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [uniqueID, block, hash, result, bigsmall, time, status, singleType]; // Assuming period can be null or auto-increment
            // Execute the query and handle potential errors
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return;
                }
                console.log('Data inserted:', results.insertId);
            });
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log("cron job working 5 .........")
            const [trxgetData] = await connection.execute('SELECT * FROM trx WHERE type = 3 ORDER BY id DESC LIMIT 10', []);
            const trxdataFiveMinute = trxgetData.map(item => {
                // Update hash to show only the last 6 characters
                item.hash = item.hash.slice(-4);
              
                // Update time to show only the time part (HH:mm:ss)
                item.time = item.time.split(' ')[1];
              
                // Format period field as per your requirement
                const formattedPeriod = `202**${item.period.toString().slice(-4)}`;
                item.period = formattedPeriod;
              
                // Return the modified item
                return item;
              });
            // console.log("trxdata...", trxdataFiveMinute)
            io.emit('data-server-trxFiveMinute', { data: trxdataFiveMinute });
            const [trxgetperiod] = await connection.execute('SELECT * FROM trx WHERE type = 3 ORDER BY id DESC LIMIT 1', []);
            console.log("trxgetperiod...",trxgetperiod[0].period);
            const trxPeriodData=trxgetperiod[0].period +1;
            // console.log("trx period data with + 1 value ....",trxPeriodData)
            io.emit('data-server-trxFiveMinute-get-period', { data: trxPeriodData });
            await sleep(56000);
            const latestBlock = await fetchLatestBlock(3, 100);
            // console.log("Latest block DATA IS ..:", latestBlock);
            
            console.log(".................");

            const response = await axios.get('https://codunia.com/trx.php', {
                params: {
                    blockNumber: latestBlock
                }
            });
            // Log the entire API response to debug the structure
            console.log('API Response:', response.data);
            const data = response.data;
            // Extract required fields from the API response
            const block = data.BlockHeight;
            const hash = data.Hash;
            const result = data.result;
            const time = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp
            const bigsmall = result <= 4 ? 'small' : 'big';
            const status = 1;
            const singleType = 3;
            // SQL query to insert data
            const uniqueID = generateUniqueID();
            console.log("uniqueId .....",uniqueID)
            const query = 'INSERT INTO trx (period, block, hash, result, bigsmall, time, status,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [uniqueID, block, hash, result, bigsmall, time, status, singleType]; // Assuming period can be null or auto-increment
            // Execute the query and handle potential errors
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return;
                }
                console.log('Data inserted:', results.insertId);
            });
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    });
    
    // cron.schedule('*/10 * * * ', async () => {
    //     try {
    //         await sleep(596000);
    //         const latestBlock = await fetchLatestBlock(4, 200);
    //         console.log("Latest block DATA IS ..:", latestBlock);
    //         console.log(".................");
    //         const response = await axios.get('https://codunia.com/trx.php', {
    //             params: {
    //                 blockNumber: latestBlock
    //             }
    //         });
    //         // Log the entire API response to debug the structure
    //         console.log('API Response:', response.data);
    //         const data = response.data;
    //         // Extract required fields from the API response
    //         const block = data.BlockHeight;
    //         const hash = data.Hash;
    //         const result = data.result;
    //         const time = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp
    //         const bigsmall = result <= 4 ? 'small' : 'big';
    //         const status = 1;
    //         const fourType = 4;
    //         // SQL query to insert data
    //         const query = 'INSERT INTO trx (period, block, hash, result, bigsmall, time, status,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    //         const values = ['22', block, hash, result, bigsmall, time, status, fourType]; // Assuming period can be null or auto-increment
    //         // Execute the query and handle potential errors
    //         connection.query(query, values, (err, results) => {
    //             if (err) {
    //                 console.error('Error inserting data:', err);
    //                 return;
    //             }
    //             console.log('Data inserted:', results.insertId);
    //         });
    //     } catch (error) {
    //         console.error('Error fetching data from API:', error);
    //     }
    // });



    cron.schedule('*/5 * * * *', async () => {
        await winGoController.addWinGo(5);
        await winGoController.handlingWinGo1P(5);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo5" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // Cầu mới chưa có kết quả
        io.emit('data-server', { data: data });

        await k5Controller.add5D(5);
        await k5Controller.handling5D(5);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // Cầu mới chưa có kết quả
        io.emit('data-server-5d', { data: data2, 'game': '5' });

        await k3Controller.addK3(5);
        await k3Controller.handlingK3(5);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // Cầu mới chưa có kết quả
        io.emit('data-server-k3', { data: data3, 'game': '5' });
    });
    cron.schedule('*/10 * * * *', async () => {
        await winGoController.addWinGo(10);
        await winGoController.handlingWinGo1P(10);
        const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo10" ORDER BY `id` DESC LIMIT 2 ', []);
        const data = winGo1; // Cầu mới chưa có kết quả
        io.emit('data-server', { data: data });


        await k5Controller.add5D(10);
        await k5Controller.handling5D(10);
        const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
        const data2 = k5D; // Cầu mới chưa có kết quả
        io.emit('data-server-5d', { data: data2, 'game': '10' });

        await k3Controller.addK3(10);
        await k3Controller.handlingK3(10);
        const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
        const data3 = k3; // Cầu mới chưa có kết quả
        io.emit('data-server-k3', { data: data3, 'game': '10' });
    });

    cron.schedule('* * 0 * * *', async () => {
        await connection.execute('UPDATE users SET roses_today = ?', [0]);
        await connection.execute('UPDATE point_list SET money = ?', [0]);
    });
}

module.exports = {
    cronJobGame1p
};