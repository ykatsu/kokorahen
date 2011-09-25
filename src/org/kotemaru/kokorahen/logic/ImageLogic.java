package org.kotemaru.kokorahen.logic;

import java.io.*;
import java.util.*;
import java.net.URL;
import java.net.URLDecoder;

import javax.servlet.ServletConfig;
import javax.servlet.http.*;

import com.google.appengine.api.images.*;
import com.google.appengine.api.urlfetch.*;
import com.kawao.kakasi.Kakasi;
import com.kawao.kakasi.KanwaDictionary;

@SuppressWarnings("serial")
public class ImageLogic {
    public static final String HIRAGANA = "hiragana";

    public static ImageLogic instance = null;

    private ImagesService imagesService = ImagesServiceFactory.getImagesService();  
    private URLFetchService urlFetchService = URLFetchServiceFactory.getURLFetchService();
    
    public static ImageLogic getInstance() {
    	if (instance == null) {
    		instance= new ImageLogic();
    	}
    	return instance;
    }
 
    public ImageLogic() {
    }

    public byte[] toThumbnail(String url, int size) throws IOException {
    	HTTPResponse res = urlFetchService.fetch(new URL(url));
    	if (res.getResponseCode() != 200) {
    		throw new RuntimeException("Not found "+url);
    	}
    	byte[] data = res.getContent();
    	return toThumbnail(data, size);
    }
    
    public byte[] toThumbnail(byte[] orgImg, int size)  {
        Image image = ImagesServiceFactory.makeImage(orgImg);
        List<Transform> ts = new ArrayList<Transform>();
        float wr = ((float) size) / image.getWidth();
        float hr = ((float) size) / image.getHeight();
        if ( wr > hr  ) {
            float nh =  image.getHeight()*wr;
            float r =  (1.0F - ((float) size ) / nh ) /2;
            ts.add(ImagesServiceFactory.makeResize( size, (int) Math.floor( nh ) ));
            ts.add(ImagesServiceFactory.makeCrop( 0, r, 1.0, 1.0-r ));
        } else {
            float nw =  image.getWidth()*hr;
            float r =  (1.0F - ((float) size ) / nw ) /2;
            ts.add(ImagesServiceFactory.makeResize( (int) Math.floor( nw ), size ));
            ts.add(ImagesServiceFactory.makeCrop( r, 0, 1.0-r, 1.0 ));
        }
        Transform t = ImagesServiceFactory.makeCompositeTransform(ts);
        OutputSettings settings = new OutputSettings(ImagesService.OutputEncoding.JPEG);
        settings.setQuality(60);
        Image thumbnail = imagesService.applyTransform(t, image, settings);
        return thumbnail.getImageData();
    }
/*	
	public List<Long> getMyImageIds() {
		ImageModelMeta e = ImageModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.userId.equal(loginUser.getUserId()));
		q.sort(e.createDate.desc);
		List<Long> list = new ArrayList(16);
		Iterator<Key> ite = q.asKeyIterator();
		while (ite.hasNext()) {
			list.add(Long.valueOf(ite.next().getId()));
		}
		return list;
	}

	public  String writeImage(MultiPartMap params) {
		FileItem fileItem = params.toFileItem("file");
		if (fileItem == null || fileItem.getData().length == 0) {
			return "";
		}
		byte[] data = ImageLogic.getInstance().toThumbnail(fileItem.getData(), 128);

		
		ImageModel img = new ImageModel();
		img.setUserId(loginUser.getUserId());
		img.setContentType("image/jpeg");
		img.setFileName(fileItem.getFileName());
		img.setCreateDate(new Date());
		img.setOriginUrl(null);
		img.setData(data);
		Key imgKey = Datastore.put(img);
		return ""+imgKey.getId();
	}

	public  String writeImageOrigin(String url) throws IOException {
		byte[] data = ImageLogic.getInstance().toThumbnail(url, 128);
		
		ImageModel img = new ImageModel();
		img.setUserId(loginUser.getUserId());
		img.setContentType("image/jpeg");
		img.setFileName(null);
		img.setCreateDate(new Date());
		img.setOriginUrl(url);
		img.setData(data);
		Key imgKey = Datastore.put(img);
		return ""+imgKey.getId();
	}
	public  ImageModel getImage(long id) {
		try {
			Key key = Datastore.createKey(ImageModel.class, id);
			ImageModel model = Datastore.get(ImageModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}
*/
	
}
