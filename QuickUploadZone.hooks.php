<?php

class QuickUploadZoneHooks{

	public static function onBeforeInitialize(
                Title &$title, &$article, OutputPage &$output,
                User &$user, WebRequest $request, MediaWiki $mediaWiki
        ) {
                if($user->isAllowed('upload')){
			$output->addModules(['net.owlfamily.mwdropzone.init']);
                }

                return true;
        }
}

?>
