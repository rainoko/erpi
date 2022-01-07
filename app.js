const fs = require('fs')
const csv = require('csv-parser');
const moment = require('moment');
const unirest = require('unirest');

const csvData = [];
fs.createReadStream('tarbimine.csv')
    .pipe(csv({separator: ';'}))
    .on('data', function (csvrow) {
        console.log(moment().format())
        console.log(csvrow);
        let date = moment(csvrow.date, 'DD.MM.YYYY hh:mm');
        csvrow.utc = date.utc().format();
        csvData.push(csvrow);
    })
    .on('end', function () {
        //do something with csvData
        console.log(csvData);
        unirest
            .get('https://dashboard.elering.ee/api/nps/price')
            .query({
                start: moment("2021-10-01T00:00:00Z").format(),
                end: moment("2022-01-02T00:00:00Z").format()
            })
            .end(function (response) {
                const ee = {}
                console.log(response.body)
                response.body.data['ee'].forEach((data) => {
                    ee[moment.unix(data.timestamp).utc().format()] = data.price;
                })
                var total = 0;
                var totalKwh = 0;
                csvData.forEach((consumption) => {
                    console.log(ee[consumption.utc]);
                    let kwh = Number(consumption.kwh);
                    consumption.price = (kwh * Number(Number(ee[consumption.utc]/1000).toFixed(2)));
                    total = total + consumption.price;
                    totalKwh += kwh;
                });
                console.log(csvData);
                console.log(total);
                console.log(totalKwh);

            });
    });
