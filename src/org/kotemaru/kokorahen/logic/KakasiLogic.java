package org.kotemaru.kokorahen.logic;

import java.io.*;
import java.net.URLDecoder;

import javax.servlet.ServletConfig;
import javax.servlet.http.*;

import com.kawao.kakasi.Kakasi;
import com.kawao.kakasi.KanwaDictionary;

@SuppressWarnings("serial")
public class KakasiLogic {
    public static final String HIRAGANA = "hiragana";

    public static KakasiLogic instance = null;

    private Kakasi kakasi;
    
    
    public static KakasiLogic getInstance() throws IOException  {
    	if (instance == null) {
    		instance= new KakasiLogic();
    	}
    	return instance;
    }
 
    public KakasiLogic()throws IOException  {
    	init();
    }
    public void close() throws IOException {
		KanwaDictionary kanwaDictionary = kakasi.getKanwaDictionary();
    	kanwaDictionary.close();
    }
   
    public String toKana(String kanji)throws IOException  {
    	String kana = kakasi.doString(kanji);
    	return kana;
    }
	
	private void init() throws IOException {
		kakasi = new Kakasi();
		kakasi.setupKanjiConverter(HIRAGANA);
		KanwaDictionary kanwaDictionary = kakasi.getKanwaDictionary();

		File dir = new File("kakasi/dic");
		File[] files = dir.listFiles();
		for (int i=0; i<files.length; i++) {
			InputStream in = new FileInputStream(files[i]);
			try {
				Reader reader = new InputStreamReader(in,"EUC-JP");
				kanwaDictionary.load(reader);
			} finally {
				in.close();
			}
		}
	}
}
