/**
 * JavaScript for QuickUploadZone.
 */
( function ( mw, $ ) {
	var Dropzone=undefined;

	var VisualEditorHelper=function(){
		
	};

	var mwdropzone,me;
	var DZUPLOAD_OK=0;
	var DZUPLOAD_ERR=-1;
	var DZUPLOAD_WARN=-2;
	var DZUPLOAD_EXISTS=1;
	var DZUPLOAD_UPLOADING=2;
	var DZUPLOAD_DUPLICATE_ARCHIVE=3;
	var DZUPLOAD_DUPLICATE_OTHER_ARCHIVE=4; //duplicate with different file name
	
	var DZPOS_LT=0;
	var DZPOS_LB=1;
	var DZPOS_RT=2;
	var DZPOS_RB=3;

	var MWDZ_EXISTS_HTML='<div class="mwdz-overwrite">Continue ?<p><button class="mwdz-yes" type="button">Yes</button><button class="mwdz-no" type="button">No</button></p></div>';
	var MWDZ_OK_HTML='<div class="mwdz-result"><button class="mwdz-block-btn mwdz-open-link" type="button">open</button>'+
				'<div class="mwdz-copy-clipboard" type="button">copy to clipboard'+
				'<button class="mwdz-btn mwdz-copy-title" type="button">Name</button>'+
				'<button class="mwdz-btn mwdz-copy-img" type="button">Image link</button>'+
				'<button class="mwdz-btn mwdz-copy-file" type="button">File link</button>'+
				'<button class="mwdz-btn mwdz-copy-media" type="button">Media link</button>'+
				'</div>'+
				'</div>';
	
	var MWDZ_PARENT_ID='mwdz-parent';
	var MWDZ_PARENT_SEL='#'+MWDZ_PARENT_ID;
	var MWDZ_TOOLBAR_ID='mwdz-toolbar';
	var MWDZ_TOOLBAR_SEL='#'+MWDZ_TOOLBAR_ID;
	var MWDZ_DZ_ID='mwdzdropzone';
	var MWDZ_DZ_SEL='#'+MWDZ_DZ_ID;
		
	var MWDZ_RESULT_CLS='mwdz-result';
	var MWDZ_RESULT_SEL='.'+MWDZ_RESULT_CLS;
	
	var MWDZ_OPEN_LINK_BTN_SEL='.mwdz-open-link';
	var MWDZ_OPEN_COPY_TITLE_BTN_SEL='.mwdz-copy-title';
	var MWDZ_OPEN_COPY_IMG_BTN_SEL='.mwdz-copy-img';
	var MWDZ_OPEN_COPY_FILE_BTN_SEL='.mwdz-copy-file';
	var MWDZ_OPEN_COPY_MEDIA_BTN_SEL='.mwdz-copy-media';
	
	//get imageinfo example : http://en.wikipedia.org/w/api.php?action=help&modules=query%2Bimageinfo
	//https://wiki.neosum.net/api.php?action=query&titles=File:Blender_Panel.png&prop=imageinfo&iiprop=url|timestamp|extmetadata|metadata|size|dimensions|mediatype&continue=



	
	
	//mwdropzone object 
	mwdropzone = {
		data:{
			setCookie:function(cname, cvalue, exdays) {
			    var d = new Date();
			    d.setTime(d.getTime() + (exdays*24*60*60*1000));
			    var expires = "expires="+ d.toUTCString();
			    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
			},
			getCookie:function(cname) {
			    var name = cname + "=";
			    var decodedCookie = decodeURIComponent(document.cookie);
			    var ca = decodedCookie.split(';');
			    for(var i = 0; i <ca.length; i++) {
			        var c = ca[i];
			        while (c.charAt(0) == ' ') {
			            c = c.substring(1);
			        }
			        if (c.indexOf(name) == 0) {
			            return c.substring(name.length, c.length);
			        }
			    }
			    return "";
			},
			restoreData:function(){
				var mwdzHeight = me.data.getCookie('mwdzHeight');
				var mwdzPos = me.data.getCookie('mwdzPos');
				if(mwdzHeight && mwdzHeight.length>0){
					if(mwdzHeight.indexOf('_')>=0){
						me.vars.mwdzHeight = parseInt(mwdzHeight,10)+'%';
					}else{
						me.vars.mwdzHeight = parseInt(mwdzHeight,10);
					}

				}
				if(mwdzPos && mwdzPos.length>0){
					me.vars.mwdzPos = parseInt(mwdzPos,10);
				}
			},
		
			//save layout data as cookie
			saveData:function(){
				if(typeof me.vars.mwdzHeight === 'string' &&  me.vars.mwdzHeight.indexOf('%')>=0){
					me.data.setCookie('mwdzHeight',parseInt(me.vars.mwdzHeight,10).toString()+'_');
				}else{
					me.data.setCookie('mwdzHeight',parseInt(me.vars.mwdzHeight,10).toString());
				}
				me.data.setCookie('mwdzPos',me.vars.mwdzPos.toString());
			}
		},
		
		//mwdropzone settings
		vars:{
			interval:1000,
			apiPath:'',
			apiToken:'',
			files:{},
			fileId:-1,
			
			mwdzHeight:'100%',
			mwdzPos:DZPOS_LT,
		},

		
		//connect with dropzone events
		dzOn:{
			//before upload
			sending:function(file,xhr,formData){
				//console.log('sending');
				//console.log(file);
				me.vars.fileId=me.vars.fileId+1;
				var newFileId = 'f'+me.vars.fileId;
				$(file.previewElement).attr('data-fileid',newFileId);
				file['fileid']=newFileId;
				me.vars.files[newFileId]=file;

				var lastSendingData = {
					action:'upload',
					format:'json',
					filename:file.name,
					token:me.vars.apiToken,
					text:me._getTextForFile(),
				};
				formData.append('action',lastSendingData.action);
				formData.append('format',lastSendingData.format);
				formData.append('filename',lastSendingData.filename);
				formData.append('token',lastSendingData.token);
				formData.append('text',lastSendingData.text);
				
				file['lastSendingData']=lastSendingData;
				me.dzOn._setFileState(file,DZUPLOAD_UPLOADING);
			},
		
			_removeFile:function(fileId){
				//console.log('removeFile : ' + fileId);
				var fileObj = me.vars.files[fileId];
				//console.log('found file');
				//console.log(me._dz);
				me._dz.removeFile(fileObj);			
				//console.log('delete from arr');
				delete me.vars.files[fileId];
			},
			_makeClipboardEvent:function(parentEl,targetSel,txt){
				(function(){
					var hasClipboard = false;
					if(Clipboard!==undefined){
						hasClipboard = true;
					}
					var sel = targetSel;
					var targetEl = $(parentEl).find(sel);
					if(targetEl){
						var onError = function(e){
							var dataLink = $(targetEl).attr('data-link');
				        		prompt ("Copy text, then click OK.", dataLink);
						};

						$(targetEl).attr('data-link',txt);
						if(hasClipboard){
							var clipboard = new Clipboard(sel,{ 
								text:function(trigger){ return trigger.getAttribute('data-link'); }
							});

							clipboard.on('success',function(e){	e.clearSelection();	});
							clipboard.on('error',function(e){	onError();	});
						}else{
							$(targetEl).click(function(){ onError(); });	
						}
					}
				})();	
			},
			_handleOk:function(file,response,upload){
				var prevEl = file.previewElement;
				var stateEl = $(prevEl).find('.mwdz-state');
				$(stateEl).append(MWDZ_OK_HTML);
				
				var openLinkBtn = $(prevEl).find(MWDZ_OPEN_LINK_BTN_SEL);
				if(upload['imageinfo']){
					var hasClipboard = false;
					if(Clipboard!==undefined){
						hasClipboard = true;
					}
					console.log('has clipboard ? ' + hasClipboard);
					$(openLinkBtn).attr('data-link',upload.imageinfo.descriptionurl);
					$(openLinkBtn).click(function(){
						var dataLink = $(this).attr('data-link');
						var win = window.open(dataLink, '_blank');
						win.focus();
					});
					me.dzOn._makeClipboardEvent(prevEl,MWDZ_OPEN_COPY_TITLE_BTN_SEL,upload.filename);
					me.dzOn._makeClipboardEvent(prevEl,MWDZ_OPEN_COPY_IMG_BTN_SEL,'[['+upload.imageinfo.canonicaltitle+']]');
					me.dzOn._makeClipboardEvent(prevEl,MWDZ_OPEN_COPY_MEDIA_BTN_SEL,'[[Media:'+upload.filename+']]');
					me.dzOn._makeClipboardEvent(prevEl,MWDZ_OPEN_COPY_FILE_BTN_SEL,'[[:'+upload.imageinfo.canonicaltitle+']]');
				}
			},
	
			//if file exists
			_handleOverwrite:function(file,response,upload){
				var prevEl = file.previewElement;
				var stateEl = $(prevEl).find('.mwdz-state');
				$(stateEl).append(MWDZ_EXISTS_HTML);

				var nobtn= $(prevEl).find('.mwdz-no');
				$(nobtn).attr('data-fileid',file.fileid);
				$(nobtn).click(function(){
					var fileId=$(this).attr('data-fileid');
					me.dzOn._removeFile(fileId);	
				});

				var yesbtn = $(prevEl).find('.mwdz-yes');
				$(yesbtn).attr('data-fileid',file.fileid);
				file.lastSendingData['filekey']=upload.filekey;
                                $(yesbtn).click(function(){
					var fileid = $(this).attr('data-fileid');
					var fileObj = me.vars.files[fileid];
					
					var filekey = fileObj.lastSendingData['filekey'];
					var fileName = fileObj.lastSendingData['filename'];

					//console.log('yes clicked with filekey : '+filekey);
                                	$.ajax({
						uploadedFile:fileObj,
						url:me.vars.apiPath,
						method:'POST',
						data:{
							action:'upload',
							format:'json',
							filekey:filekey,
							filename:fileName,
							token:me.vars.apiToken,
							ignorewarnings:'yes',
							text:me._getTextForFile(),
						},
						success:function(data){
							//console.log(data);
							var uploadResult = me.dzOn._getUploadApiResult(data);
							me.dzOn._setFileState(this.uploadedFile,uploadResult);
							if(uploadResult==DZUPLOAD_OK){
								me.dzOn._handleOk(file,data,data.upload);
							}else{
							
							}
						},
						error:function(){
							
						},
					});
				});
	
			},
			
			//display file's state 
			_setFileState:function(file,state){
				file['mwdzState']=state;
				var prevEle = file.previewElement;
				var stateEle = $(prevEle).find('.mwdz-state');
				if(stateEle.length<=0){
					$(prevEle).append('<div class="mwdz-state"></div>');
					stateEle = $(prevEle).find('.mwdz-state');
				}
				var stateString = 'NONE';
				if(state==DZUPLOAD_OK){
					stateString='OK';
				}else if(state==DZUPLOAD_ERR){
					stateString='ERROR';
				}else if(state==DZUPLOAD_WARN){
					stateString='WARNING';
				}else if(state==DZUPLOAD_EXISTS){
					stateString='ALREADY EXISTS';
				}else if(state==DZUPLOAD_UPLOADING){
					stateString='UPLOADING';
				}else if(state==DZUPLOAD_DUPLICATE_ARCHIVE){
					stateString='DUPLICATE ARCHIVE';
				}else if(state==DZUPLOAD_DUPLICATE_OTHER_ARCHIVE){
					stateString='DUPLICATE FILE WITH OTHER ARCHIVE';
				}
				$(stateEle).html(stateString);
			},
				
			
			_getUploadApiResult:function(data){
				if(data['error']){
					return DZUPLOAD_ERR;
				}
				if(data['upload']){
					var upload=data.upload;
					var uploadResult= upload.result.toLowerCase(); 
					if(uploadResult=='warning'){
						if(upload.warnings['exists']){
							return DZUPLOAD_EXISTS;
						}else if(upload.warnings['duplicate-archive']){
							return DZUPLOAD_DUPLICATE_ARCHIVE;
						}else if(upload.warnings['was-deleted']){
							return DZUPLOAD_DUPLICATE_ARCHIVE;
						}else if(upload.warnings['duplicate']){
							return DZUPLOAD_DUPLICATE_OTHER_ARCHIVE;
						}else{
							return DZUPLOAD_WARN;
						}	
					}else if(uploadResult=='success'){
						return DZUPLOAD_OK;
					}
				}
				return DZUPLOAD_ERR;
			},
			success:function(file,response){
				//console.log('success');
				//console.log(file);
				//console.log(response);
				var prevEl=file.previewElement;
				
				var uploadResult = me.dzOn._getUploadApiResult(response);
				me.dzOn._setFileState(file,uploadResult);
				if(uploadResult==DZUPLOAD_WARN || uploadResult==DZUPLOAD_EXISTS || uploadResult==DZUPLOAD_DUPLICATE_ARCHIVE || uploadResult==DZUPLOAD_DUPLICATE_OTHER_ARCHIVE){
                                	$(prevEl).attr('data-filekey',response.upload.filekey);
					me.dzOn._handleOverwrite(file,response,response.upload);
				}
				//when error occured
				else if(uploadResult==DZUPLOAD_ERR){
					alert(JSON.stringify(response.error));
				}else if(uploadResult==DZUPLOAD_OK){
					me.dzOn._handleOk(file,response,response.upload);
				}
			},
			
			addedFile:function(file){
				//console.log('added file');
				
			},
		},
		
		//initialized dropzone.js object
		_dz:null,
		
		//dropzone.js init params
		_dzInitParams:{
			url:"",
		},
	
		_dzOptions:{
			//dropzone initialize function
			init:function(){
				//console.log('init dropzone');
				me._refreshToken();
				this.on('sending',me.dzOn.sending);
				this.on('success',me.dzOn.success);
				this.on('addedfile',me.dzOn.addedFile);
			},
			paramName:"file",
			maxFilesize:5000, //GB
			accept:function(file,done){
				//console.log('accect?',file);
				//do below when you don't want upload file
				//done("naha, you don't");
				
				//allow upload
				done();
				
			},
		},

		_inited:false,
		init: function () {
			if(me._inited) return;
			me._inited=true;
			me.data.restoreData();

			//console.log('init mwdropzone');
			me.vars.apiPath = mw.config.values.wgScriptPath+'/api.php';
			
			me._dzInitParams['url']=me.vars.apiPath;
			
			me._checkEditing();
			
			setInterval(function(){
				me._checkEditing();
			},me.vars.interval);
		},
		
		//show mwdropzone element when editing the article
		_checkEditing:function(){
			if(me._isEditing()){
				me._show();
			}else{
				me._hide();
			}
		},
		
		//check article is editing
		_isEditing:function(){
			//supports normal editor and visualeditor
			if(window.location.href.indexOf('action=edit') >= 0
			||window.location.href.indexOf('veaction=edit') >= 0){
				return true;
			}	
			return false;
		},
		
		//return true if using visualeditor
		_isVeEditor:function(){
			if(window.location.href.indexOf('veaction=edit') >= 0){
				return true;
			}
			return false;
		},
		
		_show:function(){
			if(me._isDropZoneAttached()==false){
				me._createDropZone();
				me._repositionMwdzParent();
			}
			
			$(MWDZ_PARENT_SEL).show();
		},
		_hide:function(){
			$(MWDZ_PARENT_SEL).hide();
		},
		
		//check dropzone attached in screen
		_isDropZoneAttached:function(){
			if($(MWDZ_DZ_SEL).length){
				return true;
			}	
			return false;
		},
		
		//getting edittoken from mediawiki api
		_refreshTokenRetryTime:0,
		_refreshToken:function(){
			$.ajax({
				url:me.vars.apiPath,
				method:'POST',
				data:{
					action:'query',
					meta:'tokens',
					format:'json',
					continue:'',
				},		
				success:function(data,textStatus,jqXHR){
					//console.log('success refresh token');
					//console.log(data);	
					if(data['error']){
						//console.log('getting a token failed!');
						//retry 3 times
						if(me._refreshTokenRetryTime<3){
							me._refreshTokenRetryTime+=1;
							me._refreshToken();
						}
	
					}else if(data['query']){
						me.vars.apiToken=data.query.tokens.csrftoken;
					}
				},
				error:function(jqXHR,textStatus,errorThrown){
					//console.log('error');
				},	
			});			
		},
		_createDropZone:function(){
			/*if (typeof module !== "undefined" && module !== null && typeof require!=='undefined' && require!==null) {
				try{
					console.log('load dropzone');
					Dropzone = require('Dropzone');
				}catch(e){
					console.log('load dropzone error');
				}
			}*/

			if(Dropzone===undefined || !Dropzone || Dropzone===null){
				if(window['Dropzone']!==undefined){ 
					Dropzone = window.Dropzone;
				}
			}

			if(Dropzone===undefined || !Dropzone || Dropzone===null){
				console.log('there is no drop zone'); 
				return; 
			}

			Dropzone.options[MWDZ_DZ_ID]=me._dzOptions;

			Dropzone.autoDiscover = false;
			var dzParent = '<div id="'+MWDZ_PARENT_ID+'" class="mwdz-parent"></div>';
			var dzToolbar = '<div id="'+MWDZ_TOOLBAR_ID+'" class="mwdz-toolbar"></div>';
			var dzToolbarLtBtn = '<button type="button" id="mwdzLt">*</button>';
			var dzToolbarLbBtn = '<button type="button" id="mwdzLb">*</button>';
			var dzToolbarRtBtn = '<button type="button" id="mwdzRt">*</button>';
			var dzToolbarRbBtn = '<button type="button" id="mwdzRb">*</button>';

			var dzToolbarCenter = '<div id="mwdzToolbarCenter"></div>';
			var dzToolbarTitle = '<div id="mwdzToolbarTitle">Quick Upload Zone</div>';
			var dzToolbarMinBtn = '<button type="button" id="mwdzMin">-</button>';
			var dzToolbarHalfBtn = '<button type="button" id="mwdzHalf">50%</button>';
			var dzToolbarFullBtn = '<button type="button" id="mwdzFull">100%</button>';
			
			var dzTextArea = '<div class="mwdzText"><textarea id="mwdzTextArea" placeholder="File description" /></div>';

			var dzHtml = '<form id="'+MWDZ_DZ_ID+'" class="dropzone" method="post" enctype="multipart/form-data"></form>';
			$('body').append(dzParent);
			//$('body').append(dzToolbar);
			$(MWDZ_PARENT_SEL).append(dzToolbar).append(dzTextArea).append(dzHtml);
			$(MWDZ_TOOLBAR_SEL).append(dzToolbarLtBtn).append(dzToolbarLbBtn).append(dzToolbarRtBtn).append(dzToolbarRbBtn);
			$(MWDZ_TOOLBAR_SEL).append(dzToolbarCenter);
			$('#mwdzToolbarCenter').append(dzToolbarTitle).append(dzToolbarMinBtn).append(dzToolbarHalfBtn).append(dzToolbarFullBtn); 

			me._setToolbarEvents();
			me._dz = new Dropzone(MWDZ_DZ_SEL,me._dzInitParams);
		},
		_setToolbarEvents:function(){
			$('#mwdzLt').click(function(){
				me.vars.mwdzPos=DZPOS_LT;
				me._repositionMwdzParent();
			});
			$('#mwdzLb').click(function(){
				me.vars.mwdzPos=DZPOS_LB;
				me._repositionMwdzParent();
			});
			$('#mwdzRt').click(function(){
				me.vars.mwdzPos=DZPOS_RT;
				me._repositionMwdzParent();
			});
			$('#mwdzRb').click(function(){
				me.vars.mwdzPos=DZPOS_RB;
				me._repositionMwdzParent();
			});
			$('#mwdzMin').click(function(){
				me.vars.mwdzHeight=$(MWDZ_TOOLBAR_SEL).height();
				me._repositionMwdzParent();
			});
			$('#mwdzHalf').click(function(){
				me.vars.mwdzHeight='50%';
				me._repositionMwdzParent();
			});
			$('#mwdzFull').click(function(){
				me.vars.mwdzHeight='100%';
				me._repositionMwdzParent();
			});
		},
		_repositionMwdzParent:function(){
			var top='auto';
			var bottom='auto';
			var left='auto';
			var right='auto';
			switch(me.vars.mwdzPos){
				case DZPOS_LT:{
					left='0';
					top='0';	
				}break;
				case DZPOS_LB:{
					left='0';
					bottom='0';
				}break;
				case DZPOS_RT:{
					right='0';
					top='0';
				}break;
				case DZPOS_RB:{
					right='0';
					bottom='0';
				}break;
			}
			$(MWDZ_PARENT_SEL).css('top',top);
			$(MWDZ_PARENT_SEL).css('bottom',bottom);
			$(MWDZ_PARENT_SEL).css('left',left);
			$(MWDZ_PARENT_SEL).css('right',right);
			$(MWDZ_PARENT_SEL).css('height',me.vars.mwdzHeight);

			if(String(me.vars.mwdzHeight).indexOf('%')<0){
				$(MWDZ_DZ_SEL).hide();
			}else{
				$(MWDZ_DZ_SEL).show();
			}

			me.data.saveData();
		},
		_getTextForFile:function(){
			return $('#mwdzTextArea').val();
		}
	};
	me=mwdropzone;
	

	mw.libs.mwdropzone= mwdropzone;

}( mediaWiki, jQuery ) );

