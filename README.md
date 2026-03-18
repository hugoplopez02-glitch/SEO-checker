How to use it?

First install puppeteer-extra, puppeteer-extra-plugin-stealth

Prepare your phrases:

In the root folder, you must have a file named 

frases.xlsx

Open it and place all the phrases you want to research in the first column (Column A).

Example: "blue sky"

Run the Robot: Open a terminal in the project folder and run the following command:

bash

node seo_checker.mjs

The Process:

A visible Chrome browser will open.
The script will read the Excel file and perform a Google search for allintitle:"your phrase" one by one.
⚠️ If Google detects a bot and triggers the Captcha security screen: the script will freeze for 30 seconds. Simply solve the captcha manually and quickly, and the script will automatically resume its work!
Save the results: When finished, a file named 

resultados_seo.xlsx
 will be created. In it, you will have your keywords, the exact volume of pages competing for that title, and a difficulty indicator (Easy, Medium, Hard, or Blue Ocean).
