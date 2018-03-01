/**
 * JavaScript for CustomMenu.
 */
( function ( mw, $ ) {

var customMenu = {
	addToToolbox:function(html){
		this.getToolbox().append('<li>'+html+'</li>');
	},

	getToolbox:function(){
		if(mw.config.values.skin=='vector'){
			return $('#p-tb ul');
		}
		if(mw.config.values.skin=='monobook'){
			return $('#p-tb ul');
		}
	},

};


mw.libs['customMenu']=customMenu;

}( mediaWiki, jQuery ) );
