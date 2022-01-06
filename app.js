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
                start: moment("2021-11-01T00:00:00Z").format(),
                end: moment("2022-01-02T00:00:00Z").format()
            })
            .end(function (response) {
                const ee = {}
                console.log(response.body)
                response.body.data['ee'].forEach((data) => {
                    ee[moment.unix(data.timestamp).utc().format()] = data.price;
                    console.log(ee);
                })
                var total = 0;
                csvData.forEach((consumption) => {
                    consumption.price = consumption.kwh * ee[consumption.utc].price
                    total = total + consumption.price
                });
                console.log(csvData);
                console.log(total);

            });
    });
