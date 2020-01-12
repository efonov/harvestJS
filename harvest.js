const puppeteer = require("puppeteer");
var GoogleSpreadsheet = require("google-spreadsheet");
var creds = require("./credentials.json");
var doc = new GoogleSpreadsheet("1fhnjMQ_M_jm9cMnNQWYhWlEauOGtRNUrN2HDyWXbpIg");
var gender = require("gender-guess");
const download = require("image-downloader");

main();

async function main() {
    const browser = await puppeteer.launch({
        headless: true
    });
    console.log("launched puppeteer");
    const page = await browser.newPage({});
    await page.goto("https://www.wheaton.edu/directory/");
    await sleep(1000);
    await page.click("div.footer__grid__item.footer__grid__social > a");
    await sleep(1000);
    //#region
    await page.click("#username");
    await page.keyboard.type("elliotyoung");
    await sleep(1000);
    await page.click("#password");
    await page.keyboard.type("XXXXXXXXXXXX");
    await sleep(1000);

    //#endregion
    await page.click("#fm1 > div.row.btn-row > input.btn-submit");
    await sleep(1000);
    console.log("logged into wheaton.edu/directory/");
    console.log("scraping...");
    var students = [];
    f or(i = 1; i <= 400; i++) {
        await page.goto(
            "https://www.wheaton.edu/directory/?type=Student&page=" + i
        );
        for (j = 2; j <= 11; j++) {
            var student = await buildStudent(j);
            var name = student.f_name[0];
            var item = {
                f_name: student.f_name,
                l_name: student.l_name,
                year: student.year,
                major: student.major,
                email: student.email,
                image: student.image,
                gender: gender.guess(name).gender,
                confidence: gender.guess(name).confidence
            };
            students.push(item);
            var url = item.image;
            const options = {
                url: url,
                dest: "/Users/efonov/workspace/Directory/images/mugs"
            };

            async function downloadIMG() {
                try {
                    const { filename, image } = await download.image(options);
                    //console.log(filename); // => /path/to/dest/image.jpg
                } catch (e) {
                    console.error(e);
                }
            }

            downloadIMG();
            await sleep(200);
        }
        students.forEach(student => {
            doc.useServiceAccountAuth(creds, function(err) {
                if (err) {
                    console.log(err);
                }
                doc.addRow(1, {
                    f_name: student.f_name,
                    l_name: student.l_name,
                    year: student.year,
                    major: student.major,
                    email: student.email,
                    image: student.image,
                    gender: student.gender,
                    confidence: student.confidence
                });
                console.log(
                    "appended: " +
                    student.f_name +
                    " | " +
                    student.l_name +
                    " | " +
                    student.year +
                    " | " +
                    student.major +
                    " | " +
                    student.email +
                    " | " +
                    student.image +
                    " | " +
                    student.gender +
                    " | " +
                    student.confidence
                );
            });
        });
        students.length = 0;
    }

    //build a student object based on a row number
    async function buildStudent(row) {
        var student = await page.evaluate(row => {
            var name = document.querySelector("tr:nth-child(" + row + ") th > a")
                .innerText;
            var info = {
                f_name: name.match(/\w+/),
                l_name: name.match(/(?<= )\w+.+/),
                year: document.querySelector("tr:nth-child(" + row + ") th > small")
                    .innerText,
                major: document.querySelector(
                    "tr:nth-child(" + row + ") > td:nth-child(4)"
                ).innerText,
                email: document.querySelector("tr:nth-child(" + row + ") span")
                    .innerText,
                image: "https://intra.wheaton.edu/Directory/wcemail/" +
                    document
                    .querySelector("tr:nth-child(" + row + ") span")
                    .innerText.match(/\w+.+\w+(?=@)/g) +
                    ".jpg"
            };
            return info;
        }, row);
        return student;
    }

    async function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}