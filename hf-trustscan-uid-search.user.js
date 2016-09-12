// ==UserScript==
// @name         HF - Trustscan UID Thread Search
// @version      1.3
// @description  Adds an automatic UID thread search to the trustscan page on HF
// @author       Yani
// @match        http://*.hackforums.net/trustscan.php*
// @match        https://*.hackforums.net/trustscan.php*
// @require      https://code.jquery.com/jquery-3.1.0.slim.min.js
// @downloadURL  https://github.com/Yanikore/hf-trustscan-uid-search.user.js/raw/master/hf-trustscan-uid-search.user.js
// @updateURL 	 https://github.com/Yanikore/hf-trustscan-uid-search.user.js/raw/master/hf-trustscan-uid-search.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var pagesToScan = 3; // The search function doesn't instantly cache new threads so we'll check them ourselves

var totalLoad = (pagesToScan * 2) + 1;
var uid = parseInt($("#uid").val());
var loadingText = true;
var totalLoadCurrent = 0;
var threads = [];
var originURL = window.location.protocol + '//' + window.location.hostname;
var delay = 0;

jQuery.fn.outerHTML = function (s) {
    return (s) ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
};

function checkDone() {
    totalLoadCurrent++;

    if (loadingText && (totalLoadCurrent >= totalLoad)){
        $("table:eq(2)>tbody>tr:eq(1)>td").html("Nothing found");
    } else if(loadingText) {
        $("table:eq(2)>tbody>tr:eq(1)>td").html($("table:eq(2)>tbody>tr:eq(1)>td").html() + ".");
    }
}

function popThreads(html) {
    $(html).find("table>tbody>tr").each(function (i, e) {
        var tr = "<tr>" + $(this).html() + "</tr>";
        var trTemp;

        $(tr).find("td").each(function (index, element) {
            if ($(this).html().indexOf("<ul class=\"star_rating") == -1 && $(this).html().indexOf("href=\"forumdisplay.php?fid=") == -1)
                trTemp += $(this).outerHTML().replace(' text-align: right;', '') + $(this).html() + "</td>";
        });

        tr = "<tr>" + trTemp + "</tr>";

        if ($(tr).find("a").eq(0).text().indexOf(uid) != -1 || $(tr).find("a").eq(1).text().indexOf(uid) != -1) {
            var threadID = parseInt(tr.split("MyBB.whoPosted(")[1].split(")")[0]);
            if ($.inArray(threadID, threads) == -1) {
                threads.push(threadID);
                if (loadingText) {
                    loadingText = false;
                    $("table:eq(2)").html(
                        '<thead><tr><td class="tcat" colspan="2" width="76%"><span class="smalltext"><strong>Thread / Author</strong></span></td>' +
                        '<td class="tcat" align="center" width="7%"><span class="smalltext"><strong>Replies</strong></span></td>' +
                        '<td class="tcat" width="80"><span class="smalltext"><strong>Last Reply</strong></span></td></thead><tbody></tbody>'
                    );

                    $("table:eq(2)>tbody").html(tr);
                } else {
                    $("table:eq(2)>tbody").append(tr);
                }
            }
        }
    });
}

if (uid !== null && uid != 'undefined' && uid > 1) {
    $("table:eq(2)>tbody>tr:eq(0)>td").html("UID Search");
    $("table:eq(2)>tbody>tr:eq(1)>td").html("Loading...");
    
    setTimeout(function () {
        GM_xmlhttpRequest({
            method: "POST",
            url: "/search.php",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": originURL,
                "Cache-Control": "max-age=0",
                "Referer": originURL + "/search.php",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            },
            data: "action=do_search&keywords=" + uid + "&postthread=2&author=&matchusername=1&forums%5B%5D=all&findthreadst=1&numreplies=&postdate=0&pddir=1&threadprefix=any&sortby=lastpost&sortordr=desc&showresults=threads&submit=Search",
            onload: function (response) {
                if (response.responseText.indexOf("no results were returned") < 1)
                    popThreads(response.responseText);

                checkDone();
            },
            onabort: function () { checkDone(); },
            onerror: function () { checkDone(); },
            ontimeout: function () { checkDone(); }
        });
    }, delay);
    
    for (var page = 1; page < (pagesToScan + 1); page++) {
        delay += 800;
        setTimeout(function () {
            GM_xmlhttpRequest({
                method: "GET",
                url: "/forumdisplay.php?fid=163&page=" + page,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Origin": originURL
                },
                onload: function (response) {
                    if (response.responseText.indexOf("Marketplace Discussions Important Rules") > 0)
                        popThreads(response.responseText);

                    checkDone();
                },
                onabort: function () { checkDone(); },
                onerror: function () { checkDone(); },
                ontimeout: function () { checkDone(); }
            });
        }, delay);
        
        delay += 800;
        setTimeout(function () {
            GM_xmlhttpRequest({
                method: "GET",
                url: "/forumdisplay.php?fid=111&page=" + page,
                onload: function (response) {
                    if (response.responseText.indexOf("Deal Disputes Important Rules") > 0)
                        popThreads(response.responseText);

                    checkDone();
                },
                onabort: function () { checkDone(); },
                onerror: function () { checkDone(); },
                ontimeout: function () { checkDone(); }
            });
        }, delay);
    }
}

console.log("HF Trustscan UID Thread Search - Made by Yani");