import { Image, ScrollView, Text, TouchableOpacity, View, Linking, ImageBackground } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState, useEffect } from "react";
import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/Contexts";
import qs from 'qs';
import * as AuthSession from 'expo-auth-session';


const Login = () => {
    const info = [{
        label: 'Tên đăng nhập',
        field: 'username',
        secureTextEntry: false,
        icon: "account"
    }, {
        label: 'Mật khẩu',
        field: 'password',
        secureTextEntry: true,
        icon: "eye"
    }];
    const [user, setUser] = useState({});
    const [msg, setMsg] = useState();
    const [loading, setLoading] = useState(false);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    }
    const [secureEntry, setSecureEntry] = useState({})

    const validate = () => {
        if (Object.values(user).length === 0) {
            setMsg("Vui lòng nhập thông tin!");
            console.log("Validation failed: No user input");
            return false;
        }

        for (let i of info) {
            if (user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}`);
                console.log(`Validation failed: Missing ${i.label}`);
                return false;
            }
        }

        setMsg("");
        console.log("Validation passed");
        return true;
    };


    const toggleSecureEntry = (field) => {
        setSecureEntry(prev => ({ ...prev, [field]: !prev[field] }));

    }
    const login = async () => {
        if (validate() === true) {
            try {
                setLoading(true);
                console.log("Starting login process...");

                const data = {
                    ...user,
                    client_id: "XACNF8vlciv5XLCHD5mgR4fkOjl5FD9AR4axIeS3",
                    client_secret: "IDgWxpeSwUo8wwZFZIQZx5z1wyphov496QCTvhWThaPaTGgK51FaC2JqcdDtUwCejlvuar4QUB77vlSlHP1dV5jSK4YOamS882lVRwHxwMtk9FIJK68JTvYZXtyPNwWt",
                    grant_type: "password"
                };

                console.log("Sending login request with data:", data);

                let res = await Apis.post(endpoints['login'], qs.stringify(data), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                console.log("Response from server:", res.data);

                if (res.data.access_token) {
                    await AsyncStorage.setItem('token', res.data.access_token);
                    console.log("Access token saved successfully");
                } else {
                    throw new Error("Access token is missing");
                }

                let u = await authApi(res.data.access_token).get(endpoints['current-user']);
                console.info(u.data);

                // Lưu user ID vào AsyncStorage cho Firebase chat
                if (u.data && u.data.id) {
                    await AsyncStorage.setItem('currentUserId', u.data.id.toString());
                    console.log("User ID saved to AsyncStorage:", u.data.id.toString());
                }

                // Lưu user data đầy đủ (bao gồm role) vào AsyncStorage
                if (u.data) {
                    await AsyncStorage.setItem('role', u.data.role.toString());
                    console.log("role saved to AsyncStorage:", u.data.role.toString());
                }

                dispatch({
                    "type": "login",
                    "payload": u.data
                });
                console.log("Dispatching LOGIN", u.data);
                // nav.navigate('health');
            } catch (ex) {
                console.error("Login error:", ex);
            } finally {
                setLoading(false);
                console.log("Login process completed");
            }
        }
    }

    // const loginWithGoogle = async () => {
    //     try {
    //         const clientId = googleClientId;
    //         const redirect_uri = AuthSession.makeRedirectUri({
    //             useProxy: true,
    //             native: 'com.yourapp://redirect', // Replace with your app's redirect URI
    //         });


    //         console.log("Redirect URI:", redirect_uri);

    //         const scope = encodeURIComponent('profile email');
    //         console.log("Scope:", scope);

    //         const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=token&scope=${scope}`;

    //         // Add event listener for URL changes before opening auth URL
    //         const handleUrl = async ({ url }) => {
    //             console.log("Received URL:", url);

    //             if (url.includes('access_token=')) {
    //                 const matchToken = url.match(/access_token=([^&]+)/);
    //                 if (matchToken) {
    //                     const token = matchToken[1];
    //                     console.log("Extracted token:", token);

    //                     // Remove listener before processing token
    //                     Linking.removeEventListener('url', handleUrl);

    //                     try {

    //                         let u = await authApi(token).post(endpoints['google-login']);
    //                         console.info(u.data);
    //                         dispatch({
    //                             "type": "login",
    //                             "payload": u.data
    //                         });
    //                     } catch (apiError) {
    //                         console.error("Error in API request:", apiError);
    //                     }
    //                 }

    //             }
    //         };

    //         // Add event listener
    //         Linking.addEventListener('url', handleUrl);

    //         console.log("Opening auth URL:", authUrl);
    //         await Linking.openURL(authUrl);

    //     } catch (error) {
    //         console.error("Google login error:", error);
    //         setMsg("Đã xảy ra lỗi khi đăng nhập Google");
    //     }
    // };


    return (
        <ScrollView style={MyStyles.p}>
            <HelperText type="error" visible={msg}>{msg}</HelperText>

            {info.map(i => <TextInput key={`Login${i.field}`} value={user[i.field]}
                onChangeText={t => setState(t, i.field)}
                label={i.label}
                style={[MyStyles.m, MyStyles.bg]}
                secureTextEntry={i.secureTextEntry}
                right={i.secureTextEntry ? (
                    <TextInput.Icon
                        icon={secureEntry[i.field] === false ? "eye" : "eye-off"}
                        onPress={() => toggleSecureEntry(i.field)}
                    />
                ) : (
                    <TextInput.Icon icon={i.icon} />
                )} />)}

            <Button disabled={loading} loading={loading} onPress={login} mode="contained" buttonColor="#a7f3d0"
                textColor="#065f46">Đăng nhập</Button>
            <Text style={{ textAlign: 'center', margin: 20 }}>Hoặc đăng nhập bằng</Text>

            <Button icon="google" mode="outlined" onPress={null} style={{ marginBottom: 20 }} buttonColor="#a7f3d0"
                textColor="#065f46">
                Google
            </Button>

        </ScrollView>
    );
}

export default Login;
