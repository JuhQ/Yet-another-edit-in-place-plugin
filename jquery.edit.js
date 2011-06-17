/**
 * Yet another edit-in-place plugin for jQuery
 * This plugin enables simple "edit in place" functionality to any element.
 * @version 0.1
 * @author Juha Taurianen juha@bin.fi @juha_tauriainen
 */
(function($) {

	/**
	 * Document element
	 */
	var $document = $(document);

	$.fn.edit = function(url, configuration) {

		/**
		 * Configuration is stored in this variable
		 */
		var conf = {"maxChars": 100, "success": false, "error": false, "ajax":{"data": false,"type":"post","aids":"kebab"}, "saveOnBlur": false, "hover": false, "tooltip": "Click here to edit", "indicator": "Saving..", "saveStr": "Save", "cancelStr": "Cancel", "failStr": "Failed.. :("}, old;

		$document.delegate("form[name='edit-in-place']", "submit" + (conf.saveOnBlur === true ? " blur" : ""), function(event) {
			event.preventDefault();

			if((event.type == "focusout" && conf.hover === true) || event.keyCode == 27) {
				return false;
			}

			var $this = $(this), text = $this.find("input[name='content']").val();
			$this.attr("disabled", "disabled");

			var submit = $this.find("input[type='submit']");
			submit.val(conf.indicator).attr("disabled", "disabled");

			var data;
			if(typeof old == "undefined") {		
				data = $.extend({"content": text}, conf.ajax.data);
				old = conf.ajax.data;
			} else {
				data = $.extend({"content": text}, old);
			}

			// delete data from configuration to avoid conflict
			delete conf.ajax.data;

			var ajaxConf = {
				url: $this.attr("action"),
				data: data,
				type: conf.ajax.type,
				success: function(result) {
					if($.trim(text) == "") {
						text = conf.tooltip;
					}

					var prev = $this.parent().prev(".edit-in-place-hidden:hidden");
					prev.text(text).removeClass("edit-in-place-hidden").show().data("original", text);
					$this.remove();

					if(conf.success !== false) {
						conf.success.call(this, result);
					}
				},
				error: function(result) {
					submit.val(conf.failStr).removeAttr("disabled");
					$this.removeAttr("disabled");

					// 1.5 seconds after failing, change fail message back to save message
					setTimeout(function() {
						submit.val(conf.saveStr);
					}, 1500);

					if(conf.error !== false) {
						conf.error.call(this, result);
					}
				}
			};


			/**
			 * There's success and error functions on the configuration already, plugin does own stuff with success & error
			 * Check code above if you don't believe.
			 */
			if(typeof conf.ajax.success != "undefined") {
				delete conf.ajax.success;
			}
			if(typeof conf.ajax.error != "undefined") {
				delete conf.ajax.error;
			}

			$.extend(ajaxConf, conf.ajax);
			$.ajax(ajaxConf);
		}).keydown(function(event) {
			// if esc key was pressed, remove form
			if(event.keyCode == 27) {
				// there could be multiple elements, each with different original content
				$("form[name='edit-in-place']").each(function() {
					cancelEdit($(this));
				});
			}
		}).delegate("form[name='edit-in-place'] input[type='reset']", "click", function() {
			cancelEdit($(this).parent());
		});

		function cancelEdit($this) {
			if($this.length == 0) {
				return false;
			}

			// show hidden element and remove form
			var prev = $this.prev(".edit-in-place-hidden:hidden");
			prev.removeClass("edit-in-place-hidden").show().html(prev.data("original"));
			$this.remove();
		}

		function YAEIPP_createForm($this, event) {
			event.preventDefault();
			if(!$(event.target).is("input")) {
				var text = $this.text();
				var html = '<form style="display:inline;" method="' + conf.ajax.type + '" action="' + url + '" name="edit-in-place">';
				if(text.length > conf.maxChars) {
					html += '<textarea class="edit-in-place-content" name="content">' + text + '</textarea>';
				} else {
					html += '<input class="edit-in-place-content" type="text" name="content" value="' + text + '" />';
				}
				html += '<input type="submit" value="' + conf.saveStr + '" /> ';
				html += '<input type="reset" value="' + conf.cancelStr + '" />';
				html += '</form>';

				// hide original element and insert form after the element
				$this.addClass("edit-in-place-hidden").hide().after(html);

				// add focus to the edit input
				$this.next().find(".edit-in-place-content").focus();
			}
		}

		$.extend(true, conf, configuration);
		return this.each(function() {
			var $this = $(this);

			if(conf.tooltip !== false) {
				$this.attr("title", conf.tooltip);
			}

			$this.data("original", $this.text());

			$this.click(function(event) {
				YAEIPP_createForm($this, event);
			});

			// element can be edited by simply hovering, if defined in configuration
			if(conf.hover === true) {
				$this.hover(function(event) {
					YAEIPP_createForm($this, event);
				});
			}
		});
	};
})(jQuery);
