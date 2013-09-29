(function ($) {
	$(document).ready(function(){
		$.widget( "slomek.jsonCombo", {

			options: {
				key: 'key',
				value: 'value',
				data: [],
				select: $.noop,
			},

			_create: function() {
				this._render();
			},

			_render: function() {
				var _this = this;
				$('option', this.element).remove();
				this.options.data.forEach(function(item){
					$('<option>')
						.prop('value', item[_this.options.value])
						.text(item[_this.options.key])
						.data('item', item)
						.appendTo(_this.element);
				});
				this.element.change(function(){
					var item = _this.getSelected();
					_this.options.select(item[_this.options.key], item[_this.options.value], item);
				});
			},

			updateData: function(newData) {
				this.options.data = newData;
				this._render();
			},

			getData: function() {
				return this.options.data;
			},

			getSelected: function() {
				return $('option:selected', this.element).data('item');
			}

		});
	});
})(jQuery);
