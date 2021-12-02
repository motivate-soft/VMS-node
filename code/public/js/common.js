function checkBrowser() {

    var parser = new UAParser();
    var browser = parser.getBrowser();
    
    if (browser.name == "Firefox" && browser.version > 3)
        return true;
    if (browser.name == "IE" && browser.version > 9)
        return true;
    if (browser.name == "Chrome" && browser.version > 4)
        return true;
    if (browser.name == "Safari" && browser.version > 3)
        return true;
    if (browser.name == "Opera" && browser.version > 9)
        return true;
    if (browser.name == "Edge")
        return true;
    return false;
};

function addJsonStr(key, val) {

	return '"' + key + '":"' + val.replace('"', '\\"') + '"';
}

$(function() {
    $("body").append('<div id="overlay" style="display:none;position:absolute;top:0;left:0;height:100%;width:100%;z-index:99999"></div>');
});

function showOverlay(did) {
    $("#overlay").css("display", "block");
	$("#"+did).html('<img src="/images/processing.gif" class="processing"/>'); 
}

function hideOverlay(did) {
    $("#overlay").css("display", "none");
	$("#"+did).html(""); 
}

function highlight(t) {
    $(t).css('background-color', '#EFEFEF');
}

function unhighlight(t) {
    $(t).css('background-color', '#FFFFFF');
}

function toggleCheck() {

    var chkbox = $("#boxtop").is(":checked");
	
	$("input[ischk=1]").prop('checked', chkbox);
}

function toggle_multislt(t) {
    if (t.getAttribute("slt") == "1") {
        t.style.background = "#ffffff";
        t.style.color = "#000000";
        t.setAttribute("slt", "0");
    }
    else  {
        t.style.background = "#0A246A";
        t.style.color = "#ffffff";
        t.setAttribute("slt", "1");
    }
}

function add_multislt(id) {

    var sltel = $("#" + id + "list :selected");

    if ($("#" + id + "idx" + sltel.val()).length > 0) return;

    $("<div></div>", {
        id: id + "idx" + sltel.val(),
        text: sltel.attr("title"),
        slt: "0",
        idx: sltel.val(),
        onclick: "toggle_multislt(this)",
        style: "cursor: default;",
    }).appendTo("#" + id);
}

function remove_multislt(id) {

    $("#" + id + " > div").each(function(k, v) {
        if ($(this).attr("slt") == "1")
            $(this).remove();
    });
}

function doLogout() {
    window.location.href="/logout";
}

function doNav(nav) {
    window.location.href=nav;
}
function doMod(sub) {
    window.location.href=sub;
}

function doNothing() {
    void(0);
}
