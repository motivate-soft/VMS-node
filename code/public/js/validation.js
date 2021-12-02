validateForm = function(fields) {
    
    var chkvalue = function(eid, msg, min, max, rem) {
    
        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!$("#" + eid).val()) {
            alert('Please enter the ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else if (min && $("#" + eid).val().length < min) {
            alert('Please enter the ' + msg + ' between ' + min + ' and ' + max + ' characters!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else if (max && $("#" + eid).val().length > max) {
            alert('Please enter the ' + msg + ' between ' + min + ' and ' + max + ' characters!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }

    var chkuser = function(eid, msg, min, max, rem) {

        var userreg = /^\w*[A-Za-z0-9_\.]\w*$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, min, max, rem)) 
            return false;
        else if (!userreg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chkpass = function(eid, msg, min, max, rem) {

        var passreg = /^\w*[A-Za-z0-9]\w*$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, min, max, rem)) 
            return false;
        else if (!passreg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chkcomp = function(eid, msg, eid2, rem) {

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if ($("#" + eid).val() != $("#" + eid2).val()) {
            alert('The ' + msg + ' doesn\'t match!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }

    var chknum = function(eid, msg, min, max, rem) {

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!$("#" + eid).val()) {
            alert('Please enter the ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else if (isNaN($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else if (min && $("#" + eid).val() < min) {
            alert('Please enter the ' + msg + ' between ' + min + ' ~ ' + max + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else if (max && $("#" + eid).val() > max) {
            alert('Please enter the ' + msg + ' between ' + min + ' ~ ' + max + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chkemail = function(eid, msg, rem) {

        var emailreg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        var min = 1;
        var max = 254;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, min, max, rem)) 
            return false;
        else if (!emailreg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chkalphnu = function(eid, msg, min, max, rem) {

        var alphnureg = /^\w*[A-Za-z0-9]\w*$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, min, max, rem)) 
            return false;
        else if (!alphnureg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }

    var chkprice = function(eid, msg, min, max, rem) {

        var pricereg = /^\d{1,10}(\.\d{1,2})?$/;
    
        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chknum(eid, msg, min, max, rem)) 
            return false;
        else if (!pricereg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chkfile = function(eid, msg, min, max, rem) {

        var filereg = /^\w[\w-_\.]*$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, min, max, rem)) 
            return false;
        else if (!filereg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }

    var chkdate = function(eid, msg, rem) {

        var datereg = /^(((((0?[1-9])|(1\d)|(2[0-8]))[\/-]((0?[1-9])|(1[0-2])))|((31[\/-]((0?[13578])|(1[02])))|((29|30)[\/-]((0?[1,3-9])|(1[0-2])))))[\/-]((20[0-9][0-9])|(19[0-9][0-9])))|((29[\/-]0?2[\/-](19|20)(([02468][048])|([13579][26]))))$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, '', '', rem)) 
            return false;
        else if (!datereg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    var chktime = function(eid, msg, rem) {

        var timereg = /^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])?$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, '', '', rem)) 
            return false;
        else if (!timereg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }

    var chkyear = function(eid, msg, rem) {

        var yearreg = /^\d{4}$/;

        var remsg = (rem && rem != '') ? ' ('+rem+')': '';

        if (!chkvalue(eid, msg, '', '', rem)) 
            return false;
        else if (!yearreg.test($("#" + eid).val())) {
            alert('Invaid ' + msg + '!'+remsg);
            $("#" + eid).focus();
            return false;
        }
        else return true;
    }
    
    for (i = 0; i < fields.length; i++){
        
        if (fields[i].type == 'val' && !chkvalue(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'user' && !chkuser(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'pass' && !chkpass(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'comp' && !chkcomp(fields[i].id, fields[i].msg, fields[i].id2, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'num' && !chknum(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'email' && !chkemail(fields[i].id, fields[i].msg, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'alphnu' && !chkalphnu(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'price' && !chkprice(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'file' && !chkfile(fields[i].id, fields[i].msg, fields[i].min, fields[i].max, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'date' && !chkdate(fields[i].id, fields[i].msg, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'time' && !chktime(fields[i].id, fields[i].msg, fields[i].rem)) 
            return false;
        else if (fields[i].type == 'year' && !chkyear(fields[i].id, fields[i].msg, fields[i].rem)) 
            return false;
    }

    return true;
}
