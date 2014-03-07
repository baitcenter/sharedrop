FileDrop.App.PeerController = Ember.ObjectController.extend({
    needs: 'index',

    webrtc: Ember.computed.alias('controllers.index.webrtc'),

    filename: function () {
        var file = this.get('model.transfer.file'),
            info = this.get('model.transfer.info');

        if (file) return file.name;
        if (info) return info.name;
        return null;
    }.property('model.transfer.file', 'model.transfer.info'),

    actions: {
        // TODO: rename to something more meaningful (e.g. askIfWantToSendFile)
        uploadFile: function (data) {
            var peer = this.get('model'),
                file = data.file;

            // Make file available when the response from the recipient comes in
            peer.set('transfer.file', file);
            peer.set('internalState', 'awaiting_file_info');
        },

        sendFileTransferInquiry: function () {
            var webrtc = this.get('webrtc'),
                peer = this.get('model'),
                connection = peer.get('peer.connection'),
                file = peer.get('transfer.file'),
                info = webrtc.getFileInfo(file);

            webrtc.sendFileInfo(connection, info);
            peer.set('internalState', 'awaiting_response');

            console.log('Sending a file info...', info);
        },

        cancelFileTransfer: function () {
            var peer = this.get('model');
            peer.set('transfer.file', null);
            peer.set('internalState', 'idle');
        },

        acceptFileTransfer: function () {
            var peer = this.get('model');

            this._sendFileTransferResponse(true);

            peer.get('peer.connection').on('receiving_progress', function (progress) {
                peer.set('transfer.receivingProgress', progress);
            });
            peer.set('internalState', 'sending_file_data');
        },

        rejectFileTransfer: function () {
            var peer = this.get('model');

            this._sendFileTransferResponse(false);
            peer.set('transfer.info', null);
            peer.set('internalState', 'idle');
        }
    },

    _sendFileTransferResponse: function (response) {
        var webrtc = this.get('webrtc'),
            peer = this.get('model'),
            connection = peer.get('peer.connection');

        webrtc.sendFileResponse(connection, response);
    }
});
