var fs      = require('fs'),
    jsdom   = require("jsdom").jsdom,
    request = require('request'),
    html    = require('html'),
    _       = require('underscore'),
    jQuery  = require('jquery');

var get = function(url, cb) {
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      cb(body);
    }
  });
};

var createDocument = function(html, cb) {
  var document = jsdom(html);
  var window   = document.createWindow();
  return jsdom.jQueryify(window, cb);
};
var key = '13CqnkxzjEPe89IMNCqp71crMoNqeGU-ZBs2Hahwk_Yk',
    url = "https://docs.google.com/forms/d/"+key+"/viewform";

var templ = fs.readFileSync('page-form.template').toString();

get(url, function(body) {  
  createDocument(body, function(window) {
    var $ = window.$;

    var banished_classes = ['ss-q-short', 'ss-q-long', 'ss-choices', 'ss-choice-item', 'ss-choice-label']
    
    var form_action = $('form').attr('action');
    var $form_entries = $('form').find('.ss-form-entry');
    var new_form_html = '';

    $.each($form_entries, function(ind, form_entry){
      $(form_entry).find('label').not('.ss-choice-item label').remove(); // Get rid of labels

      $.each(banished_classes, function(ind, banished_class){
        $(form_entry).find('.'+banished_class).removeClass(banished_class);
      });

      new_form_html += $(form_entry).html();
    });

    var frame_of_death = '<iframe name="frame_of_death" width="0" height="0" style="display:none;"></iframe>';

    var $new_form = $('<form></form>')
                      .attr('action',form_action)
                      .attr('method','POST')
                      .attr('target','frame_of_death')
                      .html(new_form_html);

    var $form_container = $('<div></div>')
                              .addClass('form-container')
                              .append(frame_of_death)
                              .append($new_form.clone());

    var clean_form_html = $form_container.html().replace(/\n\n/g,'\n'); // remove double line breaks

    var form_template = _.template(templ);
    var json = {
      form: clean_form_html
    }
    var form_html = form_template(json);

    fs.writeFileSync("google-form-clean.html", html.prettyPrint(form_html, { indent_size: 2 }));
    

  });
})